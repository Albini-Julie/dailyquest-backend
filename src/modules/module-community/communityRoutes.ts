import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware';
import {
  getSubmittedQuests,
  validateCommunityQuest,
  getHomeQuest
} from './communityController';

const router = Router();

router.get('/quests', authMiddleware, getSubmittedQuests);
router.post('/quests/:id/validate', authMiddleware, validateCommunityQuest);
router.get('/home', authMiddleware, getHomeQuest);

export default router;
