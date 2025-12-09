import { Router } from 'express';
import {
  acceptQuest,
  submitProof,
  getUserQuests,
  getValidatedQuests,
} from '../controllers/UserQuestController';
import { authMiddleware } from '../middlewares/authMiddleware'; // Middleware pour vérifier JWT
import { upload } from '../middlewares/stockageMiddleware'; // Middleware pour le stockage
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

    // Récupérer toutes les quêtes existantes pour cet utilisateur
    const allUserQuests = await UserQuestModel.find({ user: userId });

    // Supprimer les quêtes qui ne sont pas du jour
    await Promise.all(
      allUserQuests.map(async (uq) => {
        if (uq.startDate < start || uq.startDate > end) {
          await uq.deleteOne();
        }
      })
    );

        // Vérifie si l'utilisateur a déjà 3 quêtes pour aujourd'hui
    let todaysQuests = await UserQuestModel.find({
      user: userId,
      startDate: { $gte: start, $lte: end }
    });

    if (todaysQuests.length < 3) {
      const needed = 3 - todaysQuests.length;

      // Tirer quêtes aléatoires uniques
      const randomQuests = await QuestModel.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: needed } }
      ]);

      // Créer les quêtes du jour restantes
      const createdQuests = await Promise.all(
        randomQuests.map(q =>
          UserQuestModel.create({
            user: userId,
            quest: q._id,
            questTitle: q.title,
            questDescription: q.description,
            questPoints: q.points,
            startDate: new Date(),
            status: "initial"
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

router.post('/:id/change', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userQuestId = req.params.id;

    // trouver la UserQuest
    const uq = await UserQuestModel.findById(userQuestId);
    if (!uq) return res.status(404).json({ error: 'UserQuest not found' });
    if (!uq.user.equals(userId)) return res.status(403).json({ error: 'Not authorized' });

    // vérifier statut
    if (uq.status !== 'initial') return res.status(400).json({ error: 'Cannot change a quest that is already started' });

    // définir période "aujourd'hui"
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    // vérifier si l'utilisateur a déjà utilisé son changement aujourd'hui
    const alreadyChanged = await UserQuestModel.exists({
      user: userId,
      startDate: { $gte: start, $lte: end },
      changed: true
    });
    if (alreadyChanged) return res.status(400).json({ error: 'You already changed a quest today' });

    // récupérer les quest ids déjà assignés aujourd'hui pour éviter doublons
    const todays = await UserQuestModel.find({
      user: userId,
      startDate: { $gte: start, $lte: end }
    }).select('quest');

    const excludedQuestIds = todays.map(d => d.quest).filter(Boolean);

    // tirer une nouvelle quête aléatoire différente des exclus
    const newQuestArr = await QuestModel.aggregate([
      { $match: { isActive: true, _id: { $nin: excludedQuestIds } } },
      { $sample: { size: 1 } }
    ]);

    // Si pas trouvé (p.ex. peu de quêtes dans la base), on peut élargir la recherche en excluant uniquement la quête courante :
    let q;
    if (newQuestArr.length === 0) {
      const fallback = await QuestModel.aggregate([
        { $match: { isActive: true, _id: { $ne: uq.quest } } },
        { $sample: { size: 1 } }
      ]);
      if (fallback.length === 0) return res.status(400).json({ error: 'No alternative quest available' });
      q = fallback[0];
    } else {
      q = newQuestArr[0];
    }

    // mettre à jour la UserQuest
    uq.quest = q._id;
    uq.questTitle = q.title;
    uq.questDescription = q.description;
    uq.questPoints = q.points;
    uq.changed = true;
    await uq.save();

    res.json(uq);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Lancer une quête
router.post('/:id/start', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userQuestId = req.params.id;

    const uq = await UserQuestModel.findById(userQuestId);
    if (!uq) return res.status(404).json({ error: 'UserQuest not found' });
    if (!uq.user.equals(userId)) return res.status(403).json({ error: 'Not authorized' });

    if (uq.status !== 'initial') 
      return res.status(400).json({ error: 'Quest cannot be started' });

    uq.status = 'in_progress';
    uq.startDate = new Date();
    await uq.save();

    res.json(uq);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Soumettre preuve
router.put('/submit/:userQuestId', authMiddleware, upload.single('proofImage'), submitProof);

// Récupérer toutes les quêtes de l'utilisateur
router.get('/me', authMiddleware, getUserQuests);

// Récupérer toutes les quêtes validées
router.get('/validated', authMiddleware, getValidatedQuests);

export default router;
