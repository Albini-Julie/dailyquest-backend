import { Router } from 'express';
import {
  acceptQuest,
  submitProof,
  getUserQuests,
  getValidatedQuests,
} from '../controllers/UserQuestController';
import { authMiddleware } from '../middlewares/authMiddleware'; // Middleware pour vérifier JWT
import { UserQuestModel } from '../models/UserQuest';
import { QuestModel } from '../models/Quest';

const router = Router();

router.get('/today', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Définir la plage de dates du jour
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Vérifie si l'utilisateur a déjà 3 quêtes pour aujourd'hui
    let todaysQuests = await UserQuestModel.find({
      user: userId,
      startDate: { $gte: start, $lte: end }
    })

    if (todaysQuests.length < 3) {
      const needed = 3 - todaysQuests.length;

      // Sélectionner quêtes aléatoires
      const count = await QuestModel.countDocuments({ isActive: true });
      const randomIndexes = Array.from({ length: needed }, () => Math.floor(Math.random() * count));

      const randomQuests: any[] = [];
      for (const i of randomIndexes) {
        const quest = await QuestModel.findOne({ isActive: true }).skip(i);
        if (quest) randomQuests.push(quest);
      }

      const createdQuests = await Promise.all(
        randomQuests.map(q =>
          UserQuestModel.create({
            user: userId,
            quest: q._id,
            questTitle: q.title,
            questDescription: q.description,
            questPoints: q.points,
            startDate: new Date(),
          })
        )
      );

      todaysQuests = [...todaysQuests, ...createdQuests];
    }

    res.json(todaysQuests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les quêtes du jour." });
  }
});

// Accepter une quête
router.post('/accept', authMiddleware, acceptQuest);

// Soumettre preuve
router.put('/submit/:userQuestId', authMiddleware, submitProof);

// Récupérer toutes les quêtes de l'utilisateur
router.get('/me', authMiddleware, getUserQuests);

// Récupérer toutes les quêtes validées
router.get('/validated', authMiddleware, getValidatedQuests);

export default router;
