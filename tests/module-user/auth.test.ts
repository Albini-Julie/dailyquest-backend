import request from 'supertest';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from "express";
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/server';
import { UserModel } from '../../src/modules/module-user/userModel';
import { UserQuestModel } from '../../src/modules/module-userQuest/userQuestModel';
import { QuestModel } from '../../src/modules/module-quest/questModel';
import jwt from 'jsonwebtoken';
import { adminMiddleware } from "../../src/middlewares/adminMiddleware";

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

describe('GET /api/auth/me', () => {
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'Julie',
      email: 'julie@test.com',
      password: 'Password123!',
    });
    token = res.body.token;
  });

  it('should return user info with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username', 'Julie');
    expect(res.body).toHaveProperty('email', 'julie@test.com');
    expect(res.body).toHaveProperty('points');
    expect(res.body).toHaveProperty('_id');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 if user not found', async () => {
  // Générer un token avec un ID qui n’existe pas
  const fakeToken = jwt.sign(
    { id: new mongoose.Types.ObjectId() },
    process.env.JWT_SECRET || 'testsecret'
  );

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${fakeToken}`);

  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('error', 'User not found');
});

});

// Tests middleware admin
describe("adminMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("retourne 401 si req.user est absent", () => {
    adminMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("retourne 403 si l'utilisateur n'est pas admin", () => {
    req.user = { isAdmin: false } as any;

    adminMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Admin access only" });
    expect(next).not.toHaveBeenCalled();
  });

  it("appelle next() si l'utilisateur est admin", () => {
    req.user = { isAdmin: true } as any;

    adminMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});