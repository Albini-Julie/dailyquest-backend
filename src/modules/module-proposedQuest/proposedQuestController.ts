// src/modules/module-proposedQuest/proposedQuestController.ts
import { Request, Response } from 'express';
import { ProposedQuestModel } from './proposedQuestModel';

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
