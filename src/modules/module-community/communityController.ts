import { Request, Response } from 'express';
import * as communityService  from './communityService';
import { UserModel } from '../module-user/userModel';

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

    const me = await UserModel.findById(userId).select('dailyValidations');

    res.json({
      quests: questsWithImage,
      dailyValidations: me?.dailyValidations ?? 0,
      dailyLimit: 10,
    });
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

export const getHomeQuest = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const [quest, me] = await Promise.all([
      communityService.getRandomSubmittedQuest(userId),
      UserModel.findById(userId).select('dailyValidations'),
    ]);

    const BASE_URL = process.env.SERVER_URL;

    res.json({
      quest: quest
        ? {
            ...quest.toObject(),
            imageUrl: quest.proofImage ? `${BASE_URL}${quest.proofImage}` : null,
          }
        : null,
      dailyValidations: me?.dailyValidations ?? 0,
      dailyLimit: 10,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

