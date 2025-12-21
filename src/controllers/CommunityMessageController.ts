import { Request, Response } from 'express';
import { UserQuestModel } from '../models/UserQuest';
import { UserModel } from '../models/User';
import { io } from '../server';

export const getSubmittedQuests = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const quests = await UserQuestModel.find({
      status: 'submitted',
      user: { $ne: userId },
      validatedBy: { $ne: userId }
    })
      .populate('user', 'username')
      .sort({ updatedAt: -1 });

    res.json(quests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const validateCommunityQuest = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const uq = await UserQuestModel.findById(req.params.id).populate('user');

    if (!uq) return res.status(404).json({ error: 'UserQuest not found' });
    if (uq.status !== 'submitted') return res.status(400).json({ error: 'Quest not submitted' });
    if (uq.user._id.equals(userId)) return res.status(400).json({ error: 'Cannot validate your own quest' });
    if (uq.validatedBy.some(id => id.equals(userId))) {
      return res.status(400).json({ error: 'Already validated' });
    }

    uq.validatedBy.push(userId);
    uq.validationCount += 1;

    if (uq.validationCount >= 5) {
      uq.status = 'validated';
      await UserModel.findByIdAndUpdate(uq.user._id, {
        $inc: { points: uq.questPoints }
      });
    }

    await uq.save();

    io.emit('questValidated', {
      userQuestId: uq._id,
      validationCount: uq.validationCount,
      status: uq.status,
      validatedBy: userId,
    });

    res.json(uq);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

