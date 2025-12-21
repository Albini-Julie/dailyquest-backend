import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/server';
import { UserModel } from '../../src/modules/module-user/userModel';
import { UserQuestModel } from '../../src/modules/module-userQuest/userQuestModel';
import { QuestModel } from '../../src/modules/module-quest/questModel';
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


describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should create a user and return a token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'Julie',
        email: 'julie@test.com',
        password: 'Password123!',
      });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      const user = await UserModel.findOne({ email: 'julie@test.com' });
      expect(user).not.toBeNull();
    });

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'Bob',
        email: 'invalid-email',
        password: 'Password123!',
      });
      expect(res.statusCode).toBe(400);
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'Alice',
        email: 'alice@test.com',
        password: '123',
      });
      expect(res.statusCode).toBe(400);
    });

    it('POST /api/auth/register - should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        username: 'Julie',
        email: 'julie@test.com',
        password: 'Password123!',
      });

      const res = await request(app).post('/api/auth/register').send({
        username: 'Julie2',
        email: 'julie@test.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(400);
      });
  });

// Tests login
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        username: 'Julie',
        email: 'julie@test.com',
        password: 'Password123!',
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'julie@test.com',
        password: 'Password123!',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'julie@test.com',
        password: 'WrongPass123',
      });
      expect(res.statusCode).toBe(401);
    });

    it('POST /api/auth/login - should fail if user does not exist', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@test.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(401);
    });
  });
});