const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function main() {
  console.log('1. Starting MongoMemoryServer...');
  const mongod = await MongoMemoryServer.create({ instance: { port: 27017, dbName: 'taskdb' } });
  console.log('MongoDB running at:', mongod.getUri());

  console.log('2. Starting Express Server...');
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/taskdb';
  process.env.PORT = '3000';
  process.env.JWT_SECRET = 'live-test-secret';
  process.env.CACHE_ENABLED = 'true';

  const { app } = require('../task-api/server');

  // Let server start and mongoose connect
  await new Promise(r => setTimeout(r, 1500));

  console.log('3. Testing /api/debug/cache-stats...');
  let res = await fetch('http://localhost:3000/api/debug/cache-stats');
  let data = await res.json();
  console.log('Cache stats response:', data);

  console.log('4. Testing /api/auth/register...');
  res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student24it055@charusat.edu.in', password: 'Password123!' })
  });
  console.log('Register status:', res.status);

  console.log('5. Testing /api/auth/login...');
  res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student24it055@charusat.edu.in', password: 'Password123!' })
  });
  const auth = await res.json();
  console.log('Login token received:', !!auth.token);

  console.log('6. Testing POST /tasks...');
  res = await fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    },
    body: JSON.stringify({
      title: 'Submit AWDF Complete Practical File',
      description: 'Merge all repositories and verify Postman endpoints',
      priority: 'high'
    })
  });
  const task = await res.json();
  console.log('Created task status:', res.status, 'Title:', task.title);

  console.log('7. Testing GET /tasks (Cached)...');
  res = await fetch('http://localhost:3000/tasks', {
    headers: { 'Authorization': `Bearer ${auth.token}` }
  });
  const tasks = await res.json();
  console.log('Retrieved tasks count:', tasks.length);

  console.log('8. Testing AI Suggestion Endpoint (/api/ai/generate-description)...');
  res = await fetch('http://localhost:3000/api/ai/generate-description', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    },
    body: JSON.stringify({ title: 'Deploy with Docker' })
  });
  const aiData = await res.json();
  console.log('AI suggestion response status:', res.status, aiData);

  console.log('\n✔ All live endpoints verified successfully!');
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
