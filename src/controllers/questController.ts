import { Request, Response } from 'express';
import { QuestModel, IQuest } from '../models/Quest';
import { UserModel, IUser } from '../models/User';
import { UserQuestModel } from '../models/UserQuest';
import { ValidationModel } from '../models/Validation';

// Créer une quête
export const createQuest = async (req: Request, res: Response) => {
  try {
    const { title, description, points } = req.body;

    const quest = await QuestModel.create({
      title,
      description,
      points: points || 10,
      creator: req.user._id,
    });

    res.status(201).json(quest);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Récupérer toutes les quêtes
export const getAllQuests = async (req: Request, res: Response) => {
  try {
    const quests = await QuestModel.find().populate('creator', 'username');
    res.json(quests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer une quête par ID
export const getQuestById = async (req: Request, res: Response) => {
  try {
    const quest = await QuestModel.findById(req.params.id).populate('creator', 'username');
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    res.json(quest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour une quête
export const updateQuest = async (req: Request, res: Response) => {
  try {
    const quest = await QuestModel.findById(req.params.id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    if (!quest.creator.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(quest, req.body);
    await quest.save();
    res.json(quest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer une quête
export const deleteQuest = async (req: Request, res: Response) => {
  try {
    const quest = await QuestModel.findById(req.params.id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    if (!quest.creator.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await quest.deleteOne();
    res.json({ message: 'Quest deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Valider une quête pour la communauté
export const validateQuest = async (req: Request, res: Response) => {
  try {
    const { userQuestId } = req.params;

    // Trouver la UserQuest
    const userQuest = await UserQuestModel.findById(userQuestId);
    if (!userQuest) return res.status(404).json({ error: 'UserQuest not found' });

    // Empêcher un utilisateur de valider deux fois
    const existingValidation = await ValidationModel.findOne({
      userQuest: userQuest._id,
      validator: req.user._id,
    });

    if (existingValidation) {
      return res.status(400).json({ error: 'Already validated' });
    }

    // Créer une validation
    await ValidationModel.create({
      userQuest: userQuest._id,
      validator: req.user._id,
      type: 'like',
    });

    // Compter les validations
    const validationCount = await ValidationModel.countDocuments({ userQuest: userQuest._id });
    userQuest.validationCount = validationCount;

    // Si validations >= 5, marquer la quête comme validée et ajouter les points
    if (validationCount >= 5 && userQuest.status !== 'validated') {
      userQuest.status = 'validated';
      const creator = await UserModel.findById(userQuest.user);
      if (creator) {
        creator.points += userQuest.questPoints;
        await creator.save();
      }
    }

    await userQuest.save();

    res.json(userQuest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
