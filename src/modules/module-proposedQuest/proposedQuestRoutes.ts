// src/modules/module-proposedQuest/proposedQuestRoutes.ts
import { Router } from 'express';
import {
  proposeQuest,
  getMyProposedQuests,
  getPendingProposedQuests,
  approveProposedQuest,
  rejectProposedQuest,
} from './proposedQuestController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { adminMiddleware } from '../../middlewares/adminMiddleware';

const router = Router();

// proposer une quête (user)
router.post('/', authMiddleware, proposeQuest);

// voir SES quêtes proposées (user)
router.get('/me', authMiddleware, getMyProposedQuests);

// voir les quêtes en attente (admin)
router.get('/pending', authMiddleware, adminMiddleware, getPendingProposedQuests);

// accepter une quête (admin)
router.post('/:id/approve', authMiddleware, adminMiddleware, approveProposedQuest);

// refuser une quête (admin)
router.post('/:id/reject', authMiddleware, adminMiddleware, rejectProposedQuest);

export default router;
