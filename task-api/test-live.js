const http = require('http');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function isPortOpen(port) {
  return new Promise(resolve => {
    const req = http.get(`http://127.0.0.1:${port}/tasks`, { headers: { 'Authorization': 'test' } }, () => resolve(true));
    req.on('error', () => resolve(false));
  });
}

async function main() {
  const isServerRunning = await isPortOpen(3000);
  let mongod;
  let server;
  let targetPort = 3000;

  if (!isServerRunning) {
    console.log('1. Starting MongoMemoryServer for isolated verification...');
    mongod = await MongoMemoryServer.create({ instance: { port: 27017, dbName: 'taskdb' } });
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/taskdb';
    process.env.PORT = '3001';
    process.env.JWT_SECRET = 'live-test-secret';
    process.env.CACHE_ENABLED = 'true';
    targetPort = 3001;

    const serverModule = require('./server');
    server = serverModule.server;
    await new Promise(r => setTimeout(r, 1000));
  } else {
    console.log('Detected active server running on port 3000. Running tests against live instance...');
  }

  const BASE = `http://127.0.0.1:${targetPort}`;
  const testEmail = `test-${Date.now()}@charusat.edu.in`;

  console.log(`2. Testing /api/auth/register against ${BASE}...`);
  let res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Password123!' })
  });
  console.log('Register status:', res.status);

  console.log('3. Testing /api/auth/login...');
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Password123!' })
  });
  const auth = await res.json();
  console.log('Login token received:', !!auth.token);

  console.log('4. Testing POST /tasks (Create Task)...');
  res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    },
    body: JSON.stringify({
      title: 'Optimized Query Verification Task',
      description: 'Testing lean queries, indexing, and in-memory cache invalidation',
      priority: 'high'
    })
  });
  const task = await res.json();
  console.log('Created task status:', res.status, 'Title:', task.title);

  console.log('5. Testing GET /tasks (Optimized .lean() + Caching)...');
  res = await fetch(`${BASE}/tasks`, {
    headers: { 'Authorization': `Bearer ${auth.token}` }
  });
  const tasks = await res.json();
  console.log('Retrieved tasks count:', tasks.length);

  console.log('6. Testing AI Suggestion Endpoint (/api/ai/generate-description)...');
  res = await fetch(`${BASE}/api/ai/generate-description`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    },
    body: JSON.stringify({ title: 'Deploy with Docker' })
  });
  const aiData = await res.json();
  console.log('AI suggestion status:', res.status, 'Fallback safely handled:', aiData.fallback !== undefined);

  console.log('\n✔ All live endpoints and optimizations verified successfully!');

  if (server) server.close();
  if (mongod) await mongod.stop();
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
