import { Request, Response } from 'express';
import * as userQuestService from '../module-userQuest/userQuestServices';

export const getSubmittedQuests = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const quests = await userQuestService.getSubmittedQuests(userId);
    res.json(quests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const validateCommunityQuest = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const uq = await userQuestService.validateCommunityQuest(userId, req.params.id);
    res.json(uq);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
