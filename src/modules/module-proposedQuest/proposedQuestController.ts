// src/modules/module-proposedQuest/proposedQuestController.ts
import { Request, Response } from 'express';
import { ProposedQuestModel } from './proposedQuestModel';
import { QuestModel } from '../module-quest/questModel';
import { socketService } from '../../socket/socketService';

// Proposer une nouvelle quête
export const proposeQuest = async (req: Request, res: Response) => {
  try {
    const { title, proofExample } = req.body;

    if (!title || !proofExample) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const proposedQuest = await ProposedQuestModel.create({
      title,
      proofExample,
      author: req.user._id,
    });

    res.status(201).json(proposedQuest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer les quêtes proposées par l'utilisateur connecté
export const getMyProposedQuests = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const quests = await ProposedQuestModel.find({
      author: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(quests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin seulement
export const getPendingProposedQuests = async (req: Request, res: Response) => {
  try {
    const quests = await ProposedQuestModel.find({ status: 'pending' })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.json(quests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin seulement
export const approveProposedQuest = async (req: Request, res: Response) => {
  try {
    const proposedQuest = await ProposedQuestModel.findById(req.params.id);

    if (!proposedQuest) {
      return res.status(404).json({ error: 'Proposed quest not found' });
    }

    // Interdire l’auto-validation
    if (proposedQuest.author.toString() === req.user!._id.toString()) {
      return res.status(403).json({
        error: 'You cannot approve your own proposed quest',
      });
    }

    if (proposedQuest.status !== 'pending') {
      return res.status(400).json({ error: 'Quest already reviewed' });
    }

    // Création de la vraie quête
    await QuestModel.create({
      title: proposedQuest.title,
      description: proposedQuest.proofExample,
      creator: proposedQuest.author,
      points: 10,
    });

    proposedQuest.status = 'approved';
    proposedQuest.reviewedAt = new Date();
    await proposedQuest.save();

    socketService.emitProposedQuestReviewed({
      questId: proposedQuest.id,
      title: proposedQuest.title,
      authorId: proposedQuest.author.toString(),
      status: 'approved',
    });

    res.json(proposedQuest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


// Admin seulement
export const rejectProposedQuest = async (req: Request, res: Response) => {
  try {
    const proposedQuest = await ProposedQuestModel.findById(req.params.id);

    if (!proposedQuest) {
      return res.status(404).json({ error: 'Proposed quest not found' });
    }

    // Interdire l’auto-refus (cohérence)
    if (proposedQuest.author.toString() === req.user!._id.toString()) {
      return res.status(403).json({
        error: 'You cannot review your own proposed quest',
      });
    }

    if (proposedQuest.status !== 'pending') {
      return res.status(400).json({ error: 'Quest already reviewed' });
    }

    proposedQuest.status = 'rejected';
    proposedQuest.reviewedAt = new Date();
    await proposedQuest.save();

    socketService.emitProposedQuestReviewed({
      questId: proposedQuest.id,
      title: proposedQuest.title,
      authorId: proposedQuest.author.toString(),
      status: 'rejected',
    });

    res.json(proposedQuest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

