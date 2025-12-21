import { Server } from 'socket.io';

// Mock du module socket avant d’importer socketService
const emitMock = jest.fn();
jest.mock('../../src/socket/socket', () => ({
  getIO: () => ({
    emit: emitMock,
  }),
  initIO: jest.fn(),
}));

import { socketService } from '../../src/socket/socketService';

describe('socketService', () => {
  beforeEach(() => {
    emitMock.mockClear();
  });

  it('should emit questValidated', () => {
    const payload = {
      userQuestId: 'abc123',
      validationCount: 2,
      status: 'submitted',
      validatedBy: 'user1',
    };
    socketService.emitQuestValidated(payload);
    expect(emitMock).toHaveBeenCalledWith('questValidated', payload);
  });

  it('should emit pointsUpdated', () => {
    const payload = { userId: 'user1', points: 10 };
    socketService.emitPointsUpdated(payload);
    expect(emitMock).toHaveBeenCalledWith('pointsUpdated', payload);
  });
});
