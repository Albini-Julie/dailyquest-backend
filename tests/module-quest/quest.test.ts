import { createQuest, getAllQuests, getQuestById, updateQuest, deleteQuest } from '../../src/modules/module-quest/questController';
import { QuestModel } from '../../src/modules/module-quest/questModel';
import { Request, Response } from 'express';

jest.mock('../../src/modules/module-quest/questModel');

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

describe('createQuest', () => {
  it('should create a quest successfully', async () => {
    (QuestModel.create as jest.Mock).mockResolvedValue({
      title: 'Test quest',
    });

    const req = {
      body: { title: 'Test quest', description: 'desc', points: 20 },
      user: { _id: mockUserId },
    } as Request;

    const res = mockResponse();

    await createQuest(req, res);

    expect(QuestModel.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 400 on error', async () => {
    (QuestModel.create as jest.Mock).mockRejectedValue(new Error('Error'));

    const req = {
      body: {},
      user: { _id: mockUserId },
    } as Request;

    const res = mockResponse();

    await createQuest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('getAllQuests', () => {
  it('should return all quests', async () => {
    (QuestModel.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue([]),
    });

    const req = {} as Request;
    const res = mockResponse();

    await getAllQuests(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });
});
describe('getQuestById', () => {
  it('should return quest if found', async () => {
    (QuestModel.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({ title: 'Quest' }),
    });

    const req = { params: { id: '1' } } as Request;
    const res = mockResponse();

    await getQuestById(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  it('should return 404 if not found', async () => {
    (QuestModel.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = { params: { id: '1' } } as Request;
    const res = mockResponse();

    await getQuestById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('updateQuest', () => {
  it('should update quest if authorized', async () => {
    const save = jest.fn();
    (QuestModel.findById as jest.Mock).mockResolvedValue({
      creator: { equals: () => true },
      save,
    });

    const req = {
      params: { id: '1' },
      body: { title: 'Updated' },
      user: { _id: mockUserId },
    } as Request;

    const res = mockResponse();

    await updateQuest(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 403 if not authorized', async () => {
    (QuestModel.findById as jest.Mock).mockResolvedValue({
      creator: { equals: () => false },
    });

    const req = {
      params: { id: '1' },
      user: { _id: mockUserId },
    } as Request;

    const res = mockResponse();

    await updateQuest(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('deleteQuest', () => {
  it('should delete quest if authorized', async () => {
    const deleteOne = jest.fn();
    (QuestModel.findById as jest.Mock).mockResolvedValue({
      creator: { equals: () => true },
      deleteOne,
    });

    const req = {
      params: { id: '1' },
      user: { _id: mockUserId },
    } as Request;

    const res = mockResponse();

    await deleteQuest(req, res);

    expect(deleteOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Quest deleted' });
  });

  it('should return 403 if not authorized', async () => {
    (QuestModel.findById as jest.Mock).mockResolvedValue({
      creator: { equals: () => false },
    });

    const req = {
      params: { id: '1' },
      user: { _id: mockUserId },
    } as Request;

    const res = mockResponse();

    await deleteQuest(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
