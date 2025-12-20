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

  it('POST /userquests/:id/start - should start a quest', async () => {
    const { token } = await createUserQuestContext('user2@test.com', 'TestUser2');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    const res = await request(app)
      .post(`/api/userquests/${questId}/start`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('POST /userquests/:id/start - should not start a quest already in progress', async () => {
    const { token } = await createUserQuestContext('user3@test.com', 'TestUser3');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    await request(app).post(`/api/userquests/${questId}/start`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).post(`/api/userquests/${questId}/start`).set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });

  it('POST /userquests/:id/start - should fail if quest does not exist', async () => {
    const { token } = await createUserQuestContext('a@test.com', 'UserA');

    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/api/userquests/${fakeId}/start`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

});

