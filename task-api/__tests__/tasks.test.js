/** Practical 12 - automated API tests (local + GitHub Actions; CI provides a mongo:7 service). */
const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task-manager-ci';

const { app } = require('../server');

let token;
const email = `ci-${Date.now()}@example.com`;

beforeAll(async () => {
  await mongoose.connection.asPromise();
  await request(app).post('/api/auth/register').send({ email, password: 'secret123' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'secret123' });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

test('GET /tasks returns 200 and an array for an authenticated user', async () => {
  const res = await request(app).get('/tasks').set('Authorization', `Bearer ${token}`);
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('GET /tasks without a token is rejected with 401', async () => {
  const res = await request(app).get('/tasks');
  expect(res.statusCode).toBe(401);
});

test('POST /tasks creates a task (201) and rejects a missing title (400)', async () => {
  const ok = await request(app).post('/tasks').set('Authorization', `Bearer ${token}`)
    .send({ title: 'CI task', description: 'created by Jest', priority: 'high' });
  expect(ok.statusCode).toBe(201);
  expect(ok.body.title).toBe('CI task');
  const bad = await request(app).post('/tasks').set('Authorization', `Bearer ${token}`).send({ description: 'no title' });
  expect(bad.statusCode).toBe(400);
});

