const request = require('supertest');
const app = require('../index');

describe('Auth routes', () => {
  it('devrait renvoyer 400 si les champs sont manquants', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toBe(400);
  });
});
