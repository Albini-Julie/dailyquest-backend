// src/modules/module-userQuest/userQuestService.ts
import { UserQuestModel } from './userQuestModel';
import { UserModel } from '../module-user/userModel';
import { getIO } from '../../socket/socket';
import mongoose from 'mongoose';
import { socketService } from '../../socket/socketService';

export const getSubmittedQuests = async (userId: string) => {
  const quests = await UserQuestModel.find({
    status: 'submitted',
    user: { $ne: userId },
    validatedBy: { $ne: userId },
  })
    .populate('user', 'username')
    .sort({ updatedAt: -1 });

  return quests;
};

// Valider une quête
export const validateCommunityQuest = async (userId: string, questId: string) => {
  const uq = await UserQuestModel.findById(questId).populate('user');
  if (!uq) throw new Error('UserQuest not found');
  if (uq.status !== 'submitted') throw new Error('Quest not submitted');
  if (uq.user._id.equals(userId)) throw new Error('Cannot validate your own quest');
  if (uq.validatedBy.some(id => id.equals(userId))) throw new Error('Already validated');

  uq.validatedBy.push(new mongoose.Types.ObjectId(userId));
  uq.validationCount += 1;

  let updatedPoints = 0;

  if (uq.validationCount >= 5) {
    uq.status = 'validated';

    // Mettre à jour les points et récupérer le total
    const updatedUser = await UserModel.findByIdAndUpdate(
      uq.user._id,
      { $inc: { points: uq.questPoints } },
      { new: true }
    );

    updatedPoints = updatedUser?.points || 0;

    // Émettre l'événement pointsUpdated
socketService.emitPointsUpdated({
  userId: uq.user._id.toString(),
  points: updatedPoints,
});

  }

  await uq.save();

if (!uq._id) throw new Error('_id missing');
  // Émettre l'événement questValidated
socketService.emitQuestValidated({
  userQuestId: uq._id.toString(),
  validationCount: uq.validationCount,
  status: uq.status,
  validatedBy: userId,
});

  return uq;
};
