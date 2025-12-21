import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  getSubmittedQuests,
  validateCommunityQuest
} from '../controllers/CommunityMessageController';

const router = Router();

router.get('/quests', authMiddleware, getSubmittedQuests);
router.post('/quests/:id/validate', authMiddleware, validateCommunityQuest);

export default router;
