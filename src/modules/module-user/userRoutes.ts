import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { getStats } from './userController';

const router = Router();

router.get('/me/compte', authMiddleware, getStats);

export default router;
