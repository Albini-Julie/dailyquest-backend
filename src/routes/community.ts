import { Router } from 'express';
import {
  postCommunityMessage,
  getCommunityMessagesByUserQuest,
} from '../controllers/CommunityMessageController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Poster une preuve dans le chat communautaire
router.post('/post', authMiddleware, postCommunityMessage);

// Récupérer toutes les preuves d'une UserQuest
router.get('/:userQuestId', authMiddleware, getCommunityMessagesByUserQuest);

export default router;
