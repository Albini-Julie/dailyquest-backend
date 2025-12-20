import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/server';
import { UserModel } from '../../src/models/User';
import { UserQuestModel } from '../../src/models/UserQuest';
import { QuestModel } from '../../src/models/Quest';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;

const generateTestToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
};

// Helper pour créer un user + ses quêtes
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

// Tests UserQuests
describe('UserQuests API', () => {

  it('GET /userquests/me - should return all user quests', async () => {
    const { token, userQuest } = await createUserQuestContext('me@test.com', 'UserMe');

    const res = await request(app)
      .get('/api/userquests/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]._id).toBe(userQuest._id.toString());
  });
  it('GET /userquests/today - should return daily quests', async () => {
    const { token } = await createUserQuestContext('testuser@test.com', 'TestUser');

    const res = await request(app)
      .get('/api/userquests/today')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length) {
      expect(res.body[0]).toHaveProperty('status');
      expect(res.body[0]).toHaveProperty('questTitle');
      expect(res.body[0]).toHaveProperty('questPoints');
    }
  });

  it('GET /userquests/today - should fail without token', async () => {
    const res = await request(app).get('/api/userquests/today');
    expect(res.statusCode).toBe(401);
  });
  it('GET /userquests/today - should fail with invalid token', async () => {
    const res = await request(app)
      .get('/api/userquests/today')
      .set('Authorization', 'Bearer faketoken');

    expect(res.statusCode).toBe(401);
  });

it('getUserQuests - should return empty array if user has no quests', async () => {
    const user = await UserModel.create({
      username: 'NoQuestUser',
      email: 'noquest@test.com',
      password: 'Password123!',
    });
    const token = generateTestToken(user._id);

    const res = await request(app)
      .get('/api/userquests/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('getUserQuests - should handle server error', async () => {
    const { token } = await createUserQuestContext('userError@test.com', 'UserError');

    // Forcer une erreur sur find
    jest.spyOn(UserQuestModel, 'find').mockImplementationOnce(() => {
      throw new Error('Forced error');
    });

    const res = await request(app)
      .get('/api/userquests/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Forced error');
  });

});

