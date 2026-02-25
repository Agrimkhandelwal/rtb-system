import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/authRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';

// Socket handlers
import { setupSocket } from './socket.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.set('io', io);

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);

// Register base socket handlers
setupSocket(io);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date() });
});

const PORT = process.env.PORT || 5000;

if (process.argv[1] === new URL(import.meta.url).pathname) {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export { app, io, httpServer };
