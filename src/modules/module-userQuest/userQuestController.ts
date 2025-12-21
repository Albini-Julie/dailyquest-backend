import { Request, Response } from 'express';
import { UserQuestModel } from './userQuestModel';

// Soumettre preuve (in_progress -> submitted)
export const submitProof = async (req: Request, res: Response) => {
  try {
    const { userQuestId } = req.params;
    const userQuest = await UserQuestModel.findById(userQuestId);
    if (!userQuest) return res.status(404).json({ error: 'UserQuest not found' });
    if (!userQuest.user.equals(req.user._id)) return res.status(403).json({ error: 'Not authorized' });
    if (userQuest.status !== 'in_progress') return res.status(400).json({ error: 'Quest not in progress' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    userQuest.proofImage = `/uploads/${req.file.filename}`; 
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