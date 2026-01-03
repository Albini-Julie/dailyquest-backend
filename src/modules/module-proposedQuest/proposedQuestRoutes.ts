// src/modules/module-proposedQuest/proposedQuestRoutes.ts
import { Router } from 'express';
import { proposeQuest, getMyProposedQuests } from './proposedQuestController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, proposeQuest);
router.get('/me', authMiddleware, getMyProposedQuests);

export default router;
