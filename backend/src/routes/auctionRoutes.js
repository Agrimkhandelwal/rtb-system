import { Router } from 'express';
import {
    createAuction,
    startAuction,
    closeAuction,
    getAuctions,
    getAuctionById,
    placeBid
} from '../controllers/auctionController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken); // Protect all auction routes

router.get('/', getAuctions);
router.get('/:id', getAuctionById);

// Admin only
router.post('/', requireRole('ADMIN'), createAuction);
router.post('/:id/start', requireRole('ADMIN'), startAuction);
router.post('/:id/close', requireRole('ADMIN'), closeAuction);

// Dealer only
router.post('/:id/bid', requireRole('DEALER'), placeBid);

export default router;
