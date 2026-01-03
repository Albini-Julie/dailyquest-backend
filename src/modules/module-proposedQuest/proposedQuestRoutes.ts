// src/modules/module-proposedQuest/proposedQuestRoutes.ts
import { Router } from 'express';
import { proposeQuest } from './proposedQuestController';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, proposeQuest);

export default router;
