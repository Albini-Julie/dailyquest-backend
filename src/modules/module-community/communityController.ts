import { Request, Response } from 'express';
import * as communityService  from './communityService';

export const getSubmittedQuests = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const quests = await communityService.getSubmittedQuests(userId);

    const BASE_URL = process.env.SERVER_URL;

    const questsWithImage = quests.map(q => {
      const imageUrl = q.proofImage ? `${BASE_URL}${q.proofImage}` : null;
      return {
        ...q.toObject(),
        imageUrl,
      };
    });

    res.json(questsWithImage);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const validateCommunityQuest = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const uq = await communityService.validateCommunityQuest(userId, req.params.id);
    res.json(uq);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
