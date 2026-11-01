/** Practical 13 - AI route behaviour (provider mocked: no network, no key needed). */
const request = require('supertest');
const mongoose = require('mongoose');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task-manager-ci';

jest.mock('../services/aiService', () => ({ generateTaskSuggestion: jest.fn() }));
const { generateTaskSuggestion } = require('../services/aiService');
const { app } = require('../server');

let token;
const email = `ai-${Date.now()}@example.com`;
beforeAll(async () => {
  await mongoose.connection.asPromise();
  await request(app).post('/api/auth/register').send({ email, password: 'secret123' });
  token = (await request(app).post('/api/auth/login').send({ email, password: 'secret123' })).body.token;
});
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.connection.close(); });

const ask = (body) => request(app).post('/api/ai/generate-description').set('Authorization', `Bearer ${token}`).send(body);

test('requires authentication (401 without token)', async () => {
  expect((await request(app).post('/api/ai/generate-description').send({ title: 'x' })).statusCode).toBe(401);
});

test('returns an AI suggestion on success', async () => {
  generateTaskSuggestion.mockResolvedValueOnce({ description: 'Plan the demo.', priority: 'high' });
  const res = await ask({ title: 'Demo prep' });
  expect(res.statusCode).toBe(200);
  expect(res.body).toMatchObject({ description: 'Plan the demo.', priority: 'high', fallback: false });
});

test('provider failure degrades gracefully: 200 + fallback, no crash', async () => {
  generateTaskSuggestion.mockRejectedValueOnce(new Error('boom'));
  const res = await ask({ title: 'Will fail' });
  expect(res.statusCode).toBe(200);
  expect(res.body.fallback).toBe(true);
});

test('rate limit: second call for the same task within a minute gets 429', async () => {
  generateTaskSuggestion.mockResolvedValue({ description: 'ok', priority: 'low' });
  expect((await ask({ title: 'Rate task', taskId: 't1' })).statusCode).toBe(200);
  expect((await ask({ title: 'Rate task', taskId: 't1' })).statusCode).toBe(429);
});

test('missing title is rejected with 400', async () => {
  expect((await ask({})).statusCode).toBe(400);
});

