// tests/module-userQuest/userQuestServices.test.ts
import mongoose from 'mongoose';
import { UserQuestModel } from '../../src/modules/module-userQuest/userQuestModel';
import { UserModel } from '../../src/modules/module-user/userModel';
import { socketService } from '../../src/socket/socketService';
import * as service from '../../src/modules/module-userQuest/userQuestServices';

jest.mock('../../src/modules/module-userQuest/userQuestModel');
jest.mock('../../src/modules/module-user/userModel');
jest.mock('../../src/socket/socketService');

const mockUserId = new mongoose.Types.ObjectId().toString();
const questId = new mongoose.Types.ObjectId().toString();

describe('userQuestServices', () => {
  let uqMock: any;

  beforeEach(() => {
    uqMock = {
      _id: new mongoose.Types.ObjectId(),
      status: 'submitted',
      user: { _id: new mongoose.Types.ObjectId() },
      validatedBy: [],
      questPoints: 10,
      validationCount: 0,
      save: jest.fn(),
    };

    (UserQuestModel.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(uqMock),
    });

    (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({ points: 50 });
    jest.clearAllMocks();
  });

  describe('getSubmittedQuests', () => {
    it('should return submitted quests', async () => {
      (UserQuestModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(['quest1', 'quest2']) }),
      });

      const result = await service.getSubmittedQuests(mockUserId);
      expect(result).toEqual(['quest1', 'quest2']);
    });

    it('should return empty array if none', async () => {
      (UserQuestModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      });

      const result = await service.getSubmittedQuests(mockUserId);
      expect(result).toEqual([]);
    });
  });

  describe('validateCommunityQuest', () => {
    it('should throw if quest not found', async () => {
      (UserQuestModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.validateCommunityQuest(mockUserId, questId))
        .rejects.toThrow('UserQuest not found');
    });

    it('should throw if quest not submitted', async () => {
      uqMock.status = 'in_progress';
      await expect(service.validateCommunityQuest(mockUserId, questId))
        .rejects.toThrow('Quest not submitted');
    });

    it('should throw if validating own quest', async () => {
      uqMock.user._id = new mongoose.Types.ObjectId(mockUserId);
      await expect(service.validateCommunityQuest(mockUserId, questId))
        .rejects.toThrow('Cannot validate your own quest');
    });

    it('should throw if already validated', async () => {
      uqMock.validatedBy = [new mongoose.Types.ObjectId(mockUserId)];
      await expect(service.validateCommunityQuest(mockUserId, questId))
        .rejects.toThrow('Already validated');
    });

    it('should validate quest and emit events without reaching 5', async () => {
      uqMock.validationCount = 2;
      const result = await service.validateCommunityQuest(mockUserId, questId);
      expect(uqMock.save).toHaveBeenCalled();
      expect(socketService.emitQuestValidated).toHaveBeenCalledWith(expect.objectContaining({
        userQuestId: uqMock._id.toString(),
        validationCount: uqMock.validationCount,
        status: uqMock.status,
        validatedBy: mockUserId,
      }));
      expect(result.status).toBe('submitted');
    });

    it('should validate quest and update points if reaching 5', async () => {
      uqMock.validationCount = 4;
      const result = await service.validateCommunityQuest(mockUserId, questId);
      expect(uqMock.status).toBe('validated');
      expect(socketService.emitPointsUpdated).toHaveBeenCalledWith(expect.objectContaining({
        userId: uqMock.user._id.toString(),
        points: 50,
      }));
      expect(socketService.emitQuestValidated).toHaveBeenCalled();
    });

    it('should throw if _id missing after save', async () => {
      uqMock._id = undefined;
      await expect(service.validateCommunityQuest(mockUserId, questId))
        .rejects.toThrow('_id missing');
    });
  });
});
