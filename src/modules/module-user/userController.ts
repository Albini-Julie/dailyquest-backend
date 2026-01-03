import { Request, Response } from 'express';
import { UserModel } from './userModel';

export const getStats = async (req: any, res: Response) => {
  try {
    const user = await UserModel.findById(req.user.id).select(
      'points successfulQuests failedQuests username isAdmin'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération stats utilisateur' });
  }
};
