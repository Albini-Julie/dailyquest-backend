import { Request, Response } from 'express';
import { UserQuestModel, IUserQuest, UserQuestStatus } from '../models/UserQuest';
import { QuestModel } from '../models/Quest';
import { UserModel } from '../models/User';
import { Types } from 'mongoose';
import { io } from '../server';

// Accepter une quête (initial -> in_progress)
export const acceptQuest = async (req: Request, res: Response) => {
  try {
    const { questId } = req.body;
    const quest = await QuestModel.findById(questId);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    const userQuest = await UserQuestModel.create({
      user: req.user._id,
      quest: quest._id,
      questTitle: quest.title,
      questDescription: quest.description,
      questPoints: quest.points,
      status: 'in_progress' as UserQuestStatus,
      startDate: new Date(),
      validationCount: 0,
    });

    res.status(201).json(userQuest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Soumettre preuve (in_progress -> submitted)
export const submitProof = async (req: Request, res: Response) => {
  try {
    const { userQuestId } = req.params;
    const userQuest = await UserQuestModel.findById(userQuestId);
    if (!userQuest) return res.status(404).json({ error: 'UserQuest not found' });
    if (!userQuest.user.equals(req.user._id)) return res.status(403).json({ error: 'Not authorized' });
    if (userQuest.status !== 'in_progress') return res.status(400).json({ error: 'Quest not in progress' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    userQuest.proofImage = `/uploads/${req.file.filename}`; // chemin relatif
    userQuest.status = 'submitted';
    userQuest.endDate = new Date();

    await userQuest.save();
    res.json(userQuest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer toutes les quêtes d’un utilisateur
export const getUserQuests = async (req: Request, res: Response) => {
  try {
    const userQuests = await UserQuestModel.find({ user: req.user._id });
    res.json(userQuests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// récupérer les quêtes submitted
export const getSubmittedQuests = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const quests = await UserQuestModel.find({
      status: 'submitted',
      user: { $ne: userId },
      validatedBy: { $ne: userId }
    })
    .populate('user', 'username') // optionnel
    .sort({ updatedAt: -1 });

    res.json(quests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


// Valider une quête (submitted -> validated)
export const validateUserQuest = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const userQuestId = req.params.id;

    const uq = await UserQuestModel.findById(userQuestId).populate('user');
    if (!uq) return res.status(404).json({ error: 'UserQuest not found' });

    if (uq.status !== 'submitted')
      return res.status(400).json({ error: 'Quest not submitted' });

    if (uq.user._id.equals(userId))
      return res.status(400).json({ error: 'Cannot validate your own quest' });

    if (uq.validatedBy.some(id => id.equals(userId)))
      return res.status(400).json({ error: 'Already validated' });

    uq.validatedBy.push(userId);
    uq.validationCount += 1;

    if (uq.validationCount >= 5) {
      uq.status = 'validated';
      await UserModel.findByIdAndUpdate(uq.user._id, {
        $inc: { points: uq.questPoints }
      });
    }

    await uq.save();

    // 🔹 Émettre l’événement temps réel
    io.emit('questValidated', uq);

    res.json(uq);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
