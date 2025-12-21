import { Request, Response } from 'express';
import { getSubmittedQuests, validateCommunityQuest } from '../../src/modules/module-community/communityController';
import * as userQuestService from '../../src/modules/module-userQuest/userQuestServices';

jest.mock('../../src/modules/module-userQuest/userQuestServices');

const mockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  return res as Response;
};

const mockUserId = '507f1f77bcf86cd799439011';

afterEach(() => {
  jest.clearAllMocks();
});

describe('getSubmittedQuests', () => {
  it('should return submitted quests', async () => {
    (userQuestService.getSubmittedQuests as jest.Mock).mockResolvedValue([
      { _id: '1', status: 'submitted' },
    ]);

    const req = {
      user: { _id: mockUserId },
    } as Request;

    const res = mockResponse();

    await getSubmittedQuests(req, res);

    expect(userQuestService.getSubmittedQuests).toHaveBeenCalledWith(mockUserId);
    expect(res.json).toHaveBeenCalledWith([
      { _id: '1', status: 'submitted' },
    ]);
  });

  it('should return 500 on error', async () => {
    (userQuestService.getSubmittedQuests as jest.Mock).mockRejectedValue(
      new Error('Service error')
    );

    const req = {
      user: { _id: mockUserId },
    } as Request;

    const res = mockResponse();

    await getSubmittedQuests(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
});

describe('validateCommunityQuest', () => {
  it('should validate a community quest', async () => {
    (userQuestService.validateCommunityQuest as jest.Mock).mockResolvedValue({
      _id: '1',
      status: 'validated',
    });

    const req = {
      user: { _id: mockUserId },
      params: { id: 'questId' },
    } as Request;

    const res = mockResponse();

    await validateCommunityQuest(req, res);

    expect(userQuestService.validateCommunityQuest).toHaveBeenCalledWith(
      mockUserId,
      'questId'
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 400 on error', async () => {
    (userQuestService.validateCommunityQuest as jest.Mock).mockRejectedValue(
      new Error('Validation error')
    );

    const req = {
      user: { _id: mockUserId },
      params: { id: 'questId' },
    } as Request;

    const res = mockResponse();

    await validateCommunityQuest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });
});
