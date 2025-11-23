import { Request, Response } from 'express';
import { CommunityMessageModel } from '../models/CommunityMessage';
import { UserQuestModel } from '../models/UserQuest';

// Poster preuve dans le chat communautaire
export const postCommunityMessage = async (req: Request, res: Response) => {
  try {
    const { userQuestId, image } = req.body;
    const userQuest = await UserQuestModel.findById(userQuestId);
    if (!userQuest) return res.status(404).json({ error: 'UserQuest not found' });

    const message = await CommunityMessageModel.create({
      userQuest: userQuest._id,
      author: req.user._id,
      image,
    });

    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer toutes les preuves d’une UserQuest
export const getCommunityMessagesByUserQuest = async (req: Request, res: Response) => {
  try {
    const { userQuestId } = req.params;
    const messages = await CommunityMessageModel.find({ userQuest: userQuestId }).populate('author', 'username');
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
