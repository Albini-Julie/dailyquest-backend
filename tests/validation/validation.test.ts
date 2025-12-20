import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/server';
import { UserModel } from '../../src/models/User';
import { UserQuestModel } from '../../src/models/UserQuest';
import { QuestModel } from '../../src/models/Quest';
import { ValidationModel } from '../../src/models/Validation';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;

const generateTestToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
};

// Helper pour créer un utilisateur et sa quête
const createUserQuestContext = async (email: string, username: string) => {
  const user = await UserModel.create({ username, email, password: 'Password123!' });

  const quest = await QuestModel.create({
    title: 'Test Quest',
    description: 'Test Description',
    points: 10,
    creator: user._id,
    isActive: true,
  });

  const userQuest = await UserQuestModel.create({
    user: user._id,
    quest: quest._id,
    questTitle: quest.title,
    questDescription: quest.description,
    questPoints: quest.points,
    status: 'initial',
    changed: false,
    validationCount: 0,
    validatedBy: [],
  });

  const token = generateTestToken(user._id);
  return { user, quest, userQuest, token };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe('ValidationController API - Validate Quest', () => {
  it('should return 404 if userQuest does not exist', async () => {
    const { token } = await createUserQuestContext('val1@test.com', 'ValUser1');
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/validation/validate/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  it('should return 400 if user already validated', async () => {
    const { token, userQuest } = await createUserQuestContext('val2@test.com', 'ValUser2');

    // Créer une validation existante
    const validator = await UserModel.create({
      username: 'Validator',
      email: 'validator@test.com',
      password: 'Password123!',
    });
    await ValidationModel.create({ userQuest: userQuest._id, validator: validator._id });

    // Mock findOne pour simuler que req.user a déjà validé
    const spy = jest.spyOn(ValidationModel, 'findOne').mockResolvedValue({} as any);

    const res = await request(app)
      .post(`/api/validation/validate/${userQuest._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    spy.mockRestore();
  });

  it('should increment validationCount and return updated userQuest', async () => {
    const { token, userQuest } = await createUserQuestContext('val3@test.com', 'ValUser3');

    const res = await request(app)
      .post(`/api/validation/validate/${userQuest._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('validationCount');
  });

  it('should return 500 on server error', async () => {
    const { token, userQuest } = await createUserQuestContext('val5@test.com', 'ValUser5');

    jest.spyOn(UserQuestModel, 'findById').mockRejectedValue(new Error('Forced error'));

    const res = await request(app)
      .post(`/api/validation/validate/${userQuest._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
  });
});
