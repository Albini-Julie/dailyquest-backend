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
  // Récupérer la quête utilisateur
  const uq = await UserQuestModel.findById(questId);
  if (!uq) throw new Error('UserQuest not found');
  if (uq.status !== 'submitted') throw new Error('Quest not submitted');
  if (uq.user.toString() === userId) throw new Error('Cannot validate your own quest');
  if (uq.validatedBy.some(id => id.toString() === userId)) {
    throw new Error('Already validated');
  }

  // Récupérer l'utilisateur validateur (lecture seule)
  const user = await UserModel.findById(userId).select(
    'dailyValidations lastValidationDate points'
  );
  if (!user) throw new Error('User not found');

  // Calcul compteur journalier
  const now = new Date();
  const sameDay =
    user.lastValidationDate &&
    user.lastValidationDate.toDateString() === now.toDateString();

  const dailyCount = sameDay ? user.dailyValidations : 0;

  // Bloquer à 10
  if (dailyCount >= 10) {
    throw new Error('Daily validation limit reached');
  }

  // Mise à jour User (atomique)
  const inc: any = { dailyValidations: 1 };
  if (dailyCount + 1 === 10) {
    inc.points = 1;
  }

  await UserModel.updateOne(
    { _id: userId },
    {
      $set: { lastValidationDate: now },
      $inc: inc,
    }
  );

  // Mise à jour UserQuest
  uq.validatedBy.push(userId as any);
  uq.validationCount += 1;

  const VALIDATION_THRESHOLD = 5;
  if (uq.validationCount >= VALIDATION_THRESHOLD) {
  uq.status = 'validated';

  const updatedOwner = await UserModel.findByIdAndUpdate(
    uq.user,
    {
      $inc: {
        points: uq.questPoints,
        successfulQuests: 1,
      },
    },
    { new: true }
  );

  // socket pour le PROPRIÉTAIRE de la quête
  if (updatedOwner) {
    socketService.emitPointsUpdated({
      userId: updatedOwner.id,
      points: updatedOwner.points,
    });
  }
}

  await uq.save();

  // Sockets (simples, sans typage fragile)
  socketService.emitQuestValidated({
    userQuestId: uq.id,
    validationCount: uq.validationCount,
    status: uq.status,
    validatedBy: userId,
  });

  if (dailyCount + 1 === 10) {
    socketService.emitPointsUpdated({
      userId,
      points: user.points + 1,
    });
  }

  return uq;
};

// Récupérer une quête communautaire aléatoire pour la page d'accueil
export const getRandomSubmittedQuest = async (userId: string) => {
  return UserQuestModel.findOne({
    status: 'submitted',
    user: { $ne: userId },
  }).sort({ updatedAt: -1 }); 
};
