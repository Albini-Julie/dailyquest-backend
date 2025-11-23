import { Router } from 'express';
import { validateUserQuest } from '../controllers/ValidationController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Valider une UserQuest
router.post('/validate/:userQuestId', authMiddleware, validateUserQuest);

export default router;
