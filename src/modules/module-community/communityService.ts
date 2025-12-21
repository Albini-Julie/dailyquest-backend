import mongoose from 'mongoose';
import { UserQuestModel } from '../module-userQuest/userQuestModel';
import { UserModel } from '../module-user/userModel';
import { getIO } from '../../socket/socket';
import { socketService } from '../../socket/socketService';

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

    // Mettre à jour les points et récupérer la valeur actuelle
    const updatedUser = await UserModel.findByIdAndUpdate(
      uq.user._id,
      { $inc: { points: uq.questPoints } },
      { new: true }
    );
    updatedPoints = updatedUser?.points || 0;

    // Émettre l'événement pour mettre à jour la cagnotte en temps réel
console.log('Emit pointsUpdated vers', uq.user._id.toString(), 'points:', updatedPoints);

socketService.emitPointsUpdated({
  userId: uq.user._id.toString(),
  points: updatedPoints,
});
  }

  await uq.save();

if (!uq._id) throw new Error('_id missing');
  // Émettre l'événement pour la mise à jour de la quête
socketService.emitQuestValidated({
  userQuestId: uq._id.toString(),
  validationCount: uq.validationCount,
  status: uq.status,
  validatedBy: userId,
});

  return uq;
};
