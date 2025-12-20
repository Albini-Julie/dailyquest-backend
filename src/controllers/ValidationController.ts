import { Request, Response } from 'express';
import { ValidationModel } from '../models/Validation';
import { UserQuestModel } from '../models/UserQuest';
import { UserModel } from '../models/User';

// Valider une UserQuest
export const validateUserQuest = async (req: Request, res: Response) => {
  try {
    const { userQuestId } = req.params;

    const userQuest = await UserQuestModel.findById(userQuestId);
    if (!userQuest) return res.status(404).json({ error: 'UserQuest not found' });

    // Vérifier si l'utilisateur a déjà validé
    const existingValidation = await ValidationModel.findOne({
      userQuest: userQuest._id,
      validator: req.user._id,
    });
    if (existingValidation) return res.status(400).json({ error: 'Already validated' });

    // Créer une validation
    await ValidationModel.create({
      userQuest: userQuest._id,
      validator: req.user._id,
    });

    // Compter validations
    const validationCount = await ValidationModel.countDocuments({ userQuest: userQuest._id });
    userQuest.validationCount = validationCount;

    // Si >= 5 validations, marquer comme validée et ajouter points
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
