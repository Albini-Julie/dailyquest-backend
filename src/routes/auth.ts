import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Endpoints Auth
router.post('/register', register);
router.post('/login', login);

// Endpoint pour récupérer les infos de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json({
      username: req.user.username,
      email: req.user.email,
      points: req.user.points,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer l’utilisateur' });
  }
});

export default router;
