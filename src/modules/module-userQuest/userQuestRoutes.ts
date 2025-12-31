import { Router } from 'express';
import {
  submitProof,
  getUserQuests,
} from './userQuestController';
import {  getSubmittedQuests, validateCommunityQuest } from '../module-community/communityController';
import { authMiddleware } from '../../middlewares/authMiddleware'; // Middleware pour vérifier JWT
import { upload } from '../../middlewares/stockageMiddleware'; // Middleware pour le stockage
import { UserQuestModel } from './userQuestModel';
import { QuestModel } from '../module-quest/questModel';
import { UserModel } from '../module-user/userModel';
import fs from 'fs';
import path from 'path';


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

    // Compteur local des quêtes ratées
    let failedCount = 0;

    // Nettoyage des quêtes hors du jour
    await Promise.all(
      allUserQuests.map(async (uq) => {
        const isNotToday = uq.startDate < start || uq.startDate > end;
        const isFailedStatus = uq.status === 'initial' || uq.status === 'in_progress';

        if (isNotToday && uq.status !== 'submitted') {

          // Compter les quêtes ratées
          if (isFailedStatus) {
            failedCount++;
          }

          // Supprimer le fichier de preuve si existant
          if (uq.proofImage) {
            const filePath = path.join(__dirname, '..', uq.proofImage);
            fs.unlink(filePath, (err) => {
              if (err) console.error('Erreur suppression fichier:', err);
            });
          }

          await uq.deleteOne();
        }
      })
    );

    // Incrémenter le compteur utilisateur UNE SEULE FOIS
    if (failedCount > 0) {
      await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { failedQuests: failedCount } }
      );
    }

    // Récupérer les quêtes du jour restantes
    let todaysQuests = await UserQuestModel.find({
      user: userId,
      startDate: { $gte: start, $lte: end }
    });

    // Créer les quêtes manquantes pour atteindre 3
    if (todaysQuests.length < 3) {
      const needed = 3 - todaysQuests.length;

      const randomQuests = await QuestModel.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: needed } }
      ]);

      const createdQuests = await Promise.all(
        randomQuests.map(q =>
          UserQuestModel.create({
            user: userId,
            quest: q._id,
            questTitle: q.title,
            questDescription: q.description,
            questPoints: q.points,
            startDate: new Date(),
            status: 'initial'
          })
        )
      );

      todaysQuests = [...todaysQuests, ...createdQuests];
    }

    res.json(todaysQuests);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Impossible de récupérer les quêtes du jour.'
    });
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

    // Si pas trouvé (p.ex. peu de quêtes dans la base), on peut élargir la recherche en excluant uniquement la quête courante
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

// Accéder à la communauté (quêtes submitted)
router.get('/submitted', authMiddleware, getSubmittedQuests);

// Récupérer toutes les quêtes de l'utilisateur
router.get('/me', authMiddleware, getUserQuests);

// valider une quête
router.post('/:id/validate', authMiddleware, validateCommunityQuest);

export default router;
