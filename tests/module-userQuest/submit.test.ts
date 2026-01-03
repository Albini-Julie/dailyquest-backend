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

describe('UserQuests API - Submit Quest', () => {

  it('PUT /userquests/submit/:id - should submit proof image', async () => {
    const { token } = await createUserQuestContext('user5@test.com', 'TestUser5');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    // Lancer la quête
    await request(app).post(`/api/userquests/${questId}/start`).set('Authorization', `Bearer ${token}`);

    // Créer un buffer JPEG minimal pour test
    const proofBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

    const res = await request(app)
      .put(`/api/userquests/submit/${questId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proofImage', proofBuffer, 'proof.jpg');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('submitted');
  });

   it('GET /userquests/submitted - should return only submitted quests from other users', async () => {
    // Créer 2 users
    const { token: token1, userQuest: uq1 } = await createUserQuestContext('u1@test.com', 'User1');
    const { user: user2 } = await createUserQuestContext('u2@test.com', 'User2');

    // Changer le status de la quête de user2 pour "submitted"
    const uq2 = await UserQuestModel.create({
      user: user2._id,
      quest: uq1.quest,
      questTitle: uq1.questTitle,
      questDescription: uq1.questDescription,
      questPoints: uq1.questPoints,
      status: 'submitted',
      validatedBy: [],
      validationCount: 0,
      changed: false,
    });

    const res = await request(app)
      .get('/api/userquests/submitted')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.quests)).toBe(true);
    // La quête de user2 doit être présente
    expect(res.body.quests.find((q: any) => q._id === uq2._id.toString())).toBeDefined();
    // La quête de user1 (lui-même) ne doit pas apparaître
    expect(res.body.quests.find((q: any) => q._id === uq1._id.toString())).toBeUndefined();
  });

  it('PUT /userquests/submit/:id - should fail with 403 if quest belongs to another user', async () => {
    const { token: token1 } = await createUserQuestContext('usera@test.com', 'UserA');
    const { userQuest: uq2 } = await createUserQuestContext('userb@test.com', 'UserB');

    // Essayer de soumettre la quête de l’autre utilisateur
    const proofBuffer = Buffer.from([0xff,0xd8,0xff,0xd9]);
    const res = await request(app)
      .put(`/api/userquests/submit/${uq2._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .attach('proofImage', proofBuffer, 'proof.jpg');

    expect(res.statusCode).toBe(403);
  });

  it('PUT /userquests/submit/:id - should fail if quest status is not in_progress', async () => {
    const { token, userQuest } = await createUserQuestContext('userc@test.com', 'UserC');

    // La quête est "initial", pas encore démarrée
    const proofBuffer = Buffer.from([0xff,0xd8,0xff,0xd9]);
    const res = await request(app)
      .put(`/api/userquests/submit/${userQuest._id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proofImage', proofBuffer, 'proof.jpg');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Quest not in progress');
  });
  it('PUT /userquests/submit/:id - should fail if quest not in progress', async () => {
    const { token } = await createUserQuestContext('e@test.com', 'UserE');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    const proofBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

    const res = await request(app)
      .put(`/api/userquests/submit/${questId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proofImage', proofBuffer, 'proof.jpg');

    expect(res.statusCode).toBe(400);
  });

  it('PUT /userquests/submit/:id - should fail without image', async () => {
    const { token } = await createUserQuestContext('f@test.com', 'UserF');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    await request(app).post(`/api/userquests/${questId}/start`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .put(`/api/userquests/submit/${questId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });

  it('should return 404 if userQuest does not exist', async () => {
  const { token } = await createUserQuestContext('b@test.com', 'UserG');
  const fakeId = new mongoose.Types.ObjectId();
  const res = await request(app)
    .put(`/api/userquests/submit/${fakeId}`)
    .set('Authorization', `Bearer ${token}`)
    .attach('proofImage', Buffer.from([0xff,0xd8,0xff,0xd9]), 'proof.jpg');
  expect(res.statusCode).toBe(404);
});
  it('getSubmittedQuests - should return empty array if no submitted quests', async () => {
    const { token } = await createUserQuestContext('userEmpty@test.com', 'UserEmpty');

    const res = await request(app)
      .get('/api/userquests/submitted')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.quests)).toBe(true);
    expect(res.body.quests.length).toBe(0);
  });

  it('submitProof - should set proofImage and endDate', async () => {
    const { token } = await createUserQuestContext('userProof@test.com', 'UserProof');
    const { body } = await request(app).get('/api/userquests/today').set('Authorization', `Bearer ${token}`);
    const questId = body[0]._id;

    // Start quest
    await request(app).post(`/api/userquests/${questId}/start`).set('Authorization', `Bearer ${token}`);

    const proofBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const res = await request(app)
      .put(`/api/userquests/submit/${questId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proofImage', proofBuffer, 'proof.jpg');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('submitted');
    expect(res.body.proofImage).toContain('/uploads/');
    expect(new Date(res.body.endDate).getTime()).toBeGreaterThan(0);
  });


  it('submitProof - should handle server error', async () => {
  const { token, userQuest } = await createUserQuestContext(
    'userProofError@test.com', 
    'UserProofError'
  );

  jest.spyOn(UserQuestModel.prototype, 'save').mockImplementationOnce(async () => {
    throw new Error('Forced save error');
  });

  await UserQuestModel.findByIdAndUpdate(userQuest._id, { status: 'in_progress' });

  const proofBuffer = Buffer.from([0xff,0xd8,0xff,0xd9]);

  const res = await request(app)
    .put(`/api/userquests/submit/${userQuest._id}`)
    .set('Authorization', `Bearer ${token}`)
    .attach('proofImage', proofBuffer, 'proof.jpg');

  expect(res.statusCode).toBe(500);
  expect(res.body.error).toBe('Forced save error');
});
});
