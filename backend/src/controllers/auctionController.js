import { query, getClient } from '../config/db.js';
import { redisPublisher, redisClient } from '../config/redis.js';

export const createAuction = async (req, res) => {
    try {
        const { item_name, start_price } = req.body;
        const created_by = req.user.userId;

        const result = await query(
            'INSERT INTO auctions (item_name, start_price, current_price, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [item_name, start_price, start_price, created_by]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const startAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'UPDATE auctions SET status = $1 WHERE id = $2 RETURNING *',
            ['ACTIVE', id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Auction not found' });

        // Publish update
        const io = req.app.get('io');
        const payload = { type: 'AUCTION_STARTED', auction: result.rows[0] };
        redisPublisher.publish('auction_updates', JSON.stringify(payload));
        io.emit('price_update', payload);

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const closeAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'UPDATE auctions SET status = $1 WHERE id = $2 RETURNING *',
            ['CLOSED', id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Auction not found' });

        const io = req.app.get('io');
        const payload = { type: 'AUCTION_CLOSED', auction: result.rows[0] };
        redisPublisher.publish('auction_updates', JSON.stringify(payload));
        io.emit('price_update', payload);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAuctions = async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                a.*,
                (
                    SELECT json_build_object(
                        'amount', b.amount,
                        'dealer_name', u.name,
                        'dealer_id', u.id
                    )
                    FROM bids b
                    JOIN users u ON b.dealer_id = u.id
                    WHERE b.auction_id = a.id
                    ORDER BY b.amount DESC
                    LIMIT 1
                ) as highest_bid
            FROM auctions a
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAuctionById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM auctions WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Auction not found' });

        // Also fetch latest bids
        const bidsResult = await query(`
      SELECT b.*, u.name as dealer_name 
      FROM bids b 
      JOIN users u ON b.dealer_id = u.id 
      WHERE auction_id = $1 
      ORDER BY b.amount DESC LIMIT 50
    `, [id]);

        res.json({ ...result.rows[0], bids: bidsResult.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 🔥 CRITICAL: CONCURRENCY-SAFE BIDDING ENGINE
export const placeBid = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    const dealer_id = req.user.userId;

    if (amount <= 0) {
        return res.status(400).json({ error: 'Bid amount must be greater than 0' });
    }

    const client = await getClient();

    try {
        await client.query('BEGIN'); // 1. Start Transaction

        // 2. Lock auction row
        const auctionRes = await client.query('SELECT * FROM auctions WHERE id = $1 FOR UPDATE', [id]);

        if (auctionRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Auction not found' });
        }

        const auction = auctionRes.rows[0];

        // 3. Ensure auction status is ACTIVE
        if (auction.status !== 'ACTIVE') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Auction is not active' });
        }

        // 4. Validate bid > current_price
        if (Number(amount) <= Number(auction.current_price)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Bid must be higher than current price' });
        }

        // 5. Insert bid record
        const bidRes = await client.query(
            'INSERT INTO bids (auction_id, dealer_id, amount) VALUES ($1, $2, $3) RETURNING *',
            [id, dealer_id, amount]
        );

        // 6. Update auction current_price
        await client.query(
            'UPDATE auctions SET current_price = $1 WHERE id = $2',
            [amount, id]
        );

        // 7. Commit Transaction
        await client.query('COMMIT');

        const newBid = bidRes.rows[0];

        // Get dealer name for socket emission
        const userRes = await query('SELECT name FROM users WHERE id = $1', [dealer_id]);
        const dealerName = userRes.rows[0]?.name || 'Unknown Dealer';

        const payload = {
            type: 'NEW_BID',
            auctionId: id,
            bid: {
                ...newBid,
                dealer_name: dealerName
            },
            current_price: amount
        };

        // Cache latest price in Redis
        await redisClient.set(`auction:${id}:price`, JSON.stringify(payload));

        // 8. Broadcast new highest bid natively via Socket.io 
        const io = req.app.get('io');
        await redisPublisher.publish('auction_events', JSON.stringify(payload));
        io.to(`auction_${id}`).emit('price_update', payload);
        io.to('admin_dashboard').emit('price_update', payload);

        res.status(201).json(newBid);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Internal server error during bidding' });
    } finally {
        client.release();
    }
};
