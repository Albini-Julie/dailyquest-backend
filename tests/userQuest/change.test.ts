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
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' }
  );
};

// Helper pour créer un user + quête
const createUserQuestContext = async (email: string, username: string) => {
  const user = await UserModel.create({
    username,
    email,
    password: 'Password123!',
  });

  const quests = await QuestModel.create([
    {
    title: 'Cuisiner un plat sain',
    description: 'Test desc',
    points: 10,
    creator: user._id,
    isActive: true,
  },
  {
    title: 'Faire une séance de sport',
    description: 'Test desc',
    points: 10,
    creator: user._id,
    isActive: true,
  },
  {
    title: 'Marcher 5km',
    description: 'Test desc',
    points: 10,
    creator: user._id,
    isActive: true,
  }
  ]);

  const userQuest = await UserQuestModel.create({
    user: user._id,
    quest: quests[0]._id,
    questTitle: quests[0].title,
    questDescription: quests[0].description,
    questPoints: quests[0].points,
    status: 'initial',
    changed: false,
    validationCount: 0,
    validatedBy: [],
  });

  // token JWT DIRECT (sans passer par l’API)
  const token = generateTestToken(user._id);

  return { user, quests, userQuest, token };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterEach(async () => {
  await UserModel.deleteMany({});
  await QuestModel.deleteMany({});
  await UserQuestModel.deleteMany({});
});

// Tests UserQuests
describe('UserQuests API', () => {
    it('POST /userquests/:id/change - should allow changing a quest if not changed', async () => {
    const { token } = await createUserQuestContext('user4@test.com', 'TestUser4');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    const res = await request(app)
      .post(`/api/userquests/${questId}/change`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.changed).toBe(true);
  });

  it('POST /userquests/:id/change - should fail if already changed', async () => {
    const { token } = await createUserQuestContext('c@test.com', 'UserC');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    await UserQuestModel.findByIdAndUpdate(questId, { changed: true });

    const res = await request(app)
      .post(`/api/userquests/${questId}/change`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });

  it('POST /userquests/:id/change - should fail if status is not initial', async () => {
    const { token } = await createUserQuestContext('d@test.com', 'UserD');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    await UserQuestModel.findByIdAndUpdate(questId, { status: 'in_progress' });

    const res = await request(app)
      .post(`/api/userquests/${questId}/change`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });
});

