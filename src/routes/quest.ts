import { Router } from 'express';
import {
  createQuest,
  getAllQuests,
  getQuestById,
  updateQuest,
  deleteQuest,
} from '../controllers/questController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Routes CRUD
router.get('/', getAllQuests);
router.get('/:id', getQuestById);
router.post('/', authMiddleware, createQuest);
router.put('/:id', authMiddleware, updateQuest);
router.delete('/:id', authMiddleware, deleteQuest);

export default router;
