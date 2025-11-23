import { Router } from 'express';
import {
  acceptQuest,
  submitProof,
  getUserQuests,
  getValidatedQuests,
} from '../controllers/UserQuestController';
import { authMiddleware } from '../middlewares/authMiddleware'; // Middleware pour vérifier JWT

const router = Router();

// Accepter une quête
router.post('/accept', authMiddleware, acceptQuest);

// Soumettre preuve
router.put('/submit/:userQuestId', authMiddleware, submitProof);

// Récupérer toutes les quêtes de l'utilisateur
router.get('/me', authMiddleware, getUserQuests);

// Récupérer toutes les quêtes validées
router.get('/validated', authMiddleware, getValidatedQuests);

export default router;
