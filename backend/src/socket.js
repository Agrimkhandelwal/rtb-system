import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

export const setupSocket = (io) => {
    // Authentication Middleware for Socket
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.data.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}, User ID: ${socket.data.user?.userId}`);

        if (socket.data.user?.role === 'ADMIN') {
            socket.join('admin_dashboard');
        }

        socket.on('joinAuction', async (auctionId) => {
            // Allow Dealer/Admin to join an auction room to get updates
            socket.join(`auction_${auctionId}`);
            console.log(`User ${socket.data.user.userId} joined room auction_${auctionId}`);
        });

        socket.on('leaveAuction', (auctionId) => {
            socket.leave(`auction_${auctionId}`);
            console.log(`User ${socket.data.user.userId} left room auction_${auctionId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
