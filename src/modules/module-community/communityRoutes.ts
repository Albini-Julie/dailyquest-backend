import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware';
import {
  getSubmittedQuests,
  validateCommunityQuest,
  getHomeQuest
} from './communityController';

const router = Router();

// Récupérer toutes les quêtes soumises sauf celles de l'utilisateur
router.get('/quests', authMiddleware, getSubmittedQuests);
// Valider une quête communautaire
router.post('/quests/:id/validate', authMiddleware, validateCommunityQuest);
// Récupérer une quête communautaire aléatoire pour la page d'accueil
router.get('/home', authMiddleware, getHomeQuest);

export default router;
