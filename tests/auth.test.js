const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany();
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('devrait créer un utilisateur et renvoyer un token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'Julie',
          email: 'julie@test.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');

      const user = await User.findOne({ email: 'julie@test.com' });
      expect(user).not.toBeNull();
    });

    it('devrait refuser un email invalide', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'Bob',
          email: 'invalid-email',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(400);
    });

    it('devrait refuser un mot de passe trop faible', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'Alice',
          email: 'alice@test.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    // Crée l’utilisateur avant chaque test de login
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        username: 'Julie',
        email: 'julie@test.com',
        password: 'Password123!'
      });
    });

    it('devrait se connecter avec les bons identifiants', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'julie@test.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('devrait échouer avec un mauvais mot de passe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'julie@test.com',
          password: 'WrongPass123'
        });

      expect(res.statusCode).toBe(401);
    });
  });
});
