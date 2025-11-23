import { Router } from 'express';
import {
  createQuest,
  getAllQuests,
  getQuestById,
  updateQuest,
  deleteQuest,
  validateQuest,
} from '../controllers/questController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Routes CRUD
router.get('/', getAllQuests);
router.get('/:id', getQuestById);
router.post('/', authMiddleware, createQuest);
router.put('/:id', authMiddleware, updateQuest);
router.delete('/:id', authMiddleware, deleteQuest);

// Validation par la communauté
router.post('/:id/validate', authMiddleware, validateQuest);

export default router;
