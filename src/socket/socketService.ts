import { getIO } from './socket';

interface QuestValidatedPayload {
  userQuestId: string;
  validationCount: number;
  status: string;
  validatedBy: string;
  successfulQuests?: number;
}

interface PointsUpdatedPayload {
  userId: string;
  points: number;
}

interface ProposedQuestReviewedPayload {
  questId: string;
  title: string;
  authorId: string;
  status: 'approved' | 'rejected';
}

class SocketService {
  emitQuestValidated(payload: QuestValidatedPayload) {
    try {
      getIO().emit('questValidated', payload);
    } catch (err) {
      console.error('SocketService: impossible d’émettre questValidated', err);
    }
  }

  emitPointsUpdated(payload: PointsUpdatedPayload) {
    try {
      getIO().emit('pointsUpdated', payload);
    } catch (err) {
      console.error('SocketService: impossible d’émettre pointsUpdated', err);
    }
  }

  emitProposedQuestReviewed(payload: ProposedQuestReviewedPayload) {
    try {
      getIO().emit('proposedQuestReviewed', payload);
    } catch (err) {
      console.error(
        'SocketService: impossible d’émettre proposedQuestReviewed',
        err
      );
    }
  }
}

// Export d’une instance unique
export const socketService = new SocketService();
