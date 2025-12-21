// src/socket/socketService.ts
import { getIO } from './socket';

interface QuestValidatedPayload {
  userQuestId: string;
  validationCount: number;
  status: string;
  validatedBy: string;
}

interface PointsUpdatedPayload {
  userId: string;
  points: number;
}

class SocketService {
  emitQuestValidated(payload: QuestValidatedPayload) {
    try {
      getIO().emit('questValidated', payload);
      console.log('SocketService: questValidated émis', payload);
    } catch (err) {
      console.error('SocketService: impossible d’émettre questValidated', err);
    }
  }

  emitPointsUpdated(payload: PointsUpdatedPayload) {
    try {
      getIO().emit('pointsUpdated', payload);
      console.log('SocketService: pointsUpdated émis', payload);
    } catch (err) {
      console.error('SocketService: impossible d’émettre pointsUpdated', err);
    }
  }
}

// Export d’une instance unique
export const socketService = new SocketService();
