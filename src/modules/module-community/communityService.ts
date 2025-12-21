// src/modules/module-community/communityService.ts
import mongoose from 'mongoose';
import { UserQuestModel } from '../module-userQuest/userQuestModel';
import { UserModel } from '../module-user/userModel';
import { socketService } from '../../socket/socketService';

// Récupérer toutes les quêtes soumises sauf celles de l'utilisateur
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

// Valider une quête communautaire
export const validateCommunityQuest = async (userId: string, questId: string) => {
  const uq = await UserQuestModel.findById(questId).populate('user');
  if (!uq) throw new Error('UserQuest not found');
  if (uq.status !== 'submitted') throw new Error('Quest not submitted');
  if (uq.user._id.equals(userId)) throw new Error('Cannot validate your own quest');
  if (uq.validatedBy.some(id => id.equals(userId))) throw new Error('Already validated');

  uq.validatedBy.push(new mongoose.Types.ObjectId(userId));
  uq.validationCount += 1;

  let updatedPoints = 0;
  const VALIDATION_THRESHOLD = 5;

  if (uq.validationCount >= VALIDATION_THRESHOLD) {
    uq.status = 'validated';
    const updatedUser = await UserModel.findByIdAndUpdate(
      uq.user._id,
      { $inc: { points: uq.questPoints } },
      { new: true }
    );
    updatedPoints = updatedUser?.points || 0;

    socketService.emitPointsUpdated({ userId: uq.user._id.toString(), points: updatedPoints });
  }

  await uq.save();

  if (!uq._id) throw new Error('_id missing');
  socketService.emitQuestValidated({
    userQuestId: uq._id.toString(),
    validationCount: uq.validationCount,
    status: uq.status,
    validatedBy: userId,
  });

  return uq;
};
