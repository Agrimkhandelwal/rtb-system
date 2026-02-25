import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rtb_user:rtb_password@localhost:5432/rtb_db',
    ...(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') || process.env.NODE_ENV === 'production'
        ? { ssl: { rejectUnauthorized: false } }
        : {})
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export const initializeDatabase = async () => {
    try {
        // Check if the old integer-based users table exists
        const checkQuery = `
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id';
        `;
        const res = await pool.query(checkQuery);
        if (res.rows.length > 0 && res.rows[0].data_type === 'integer') {
            console.log('Legacy integer-based tables detected. Wiping to upgrade to UUID...');
            await pool.query('DROP TABLE IF EXISTS bids CASCADE; DROP TABLE IF EXISTS auctions CASCADE; DROP TABLE IF EXISTS users CASCADE;');
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'DEALER')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS auctions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                item_name VARCHAR(255) NOT NULL,
                start_price DECIMAL(12, 2) NOT NULL,
                current_price DECIMAL(12, 2) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'INACTIVE' CHECK (status IN ('INACTIVE', 'ACTIVE', 'CLOSED')),
                created_by UUID REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS bids (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
                dealer_id UUID REFERENCES users(id),
                amount DECIMAL(12, 2) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Indexes for fast lookup
            CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
            CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
            CREATE INDEX IF NOT EXISTS idx_bids_dealer_id ON bids(dealer_id);
        `);
        console.log('Database tables successfully initialized.');
    } catch (err) {
        console.error('Failed to initialize database tables:', err);
    }
};
