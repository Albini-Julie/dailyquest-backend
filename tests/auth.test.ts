import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/server';
import { UserModel } from '../src/models/User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    // @ts-ignore
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
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
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should create a user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
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
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'Bob',
          email: 'invalid-email',
          password: 'Password123!',
        });
      expect(res.statusCode).toBe(400);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'Alice',
          email: 'alice@test.com',
          password: '123',
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        username: 'Julie',
        email: 'julie@test.com',
        password: 'Password123!',
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'julie@test.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'julie@test.com',
          password: 'WrongPass123',
        });

      expect(res.statusCode).toBe(401);
    });
  });
});
