import { Request, Response } from 'express';
import { QuestModel } from '../models/Quest';

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