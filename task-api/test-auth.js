const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-secret-key-for-automated-tests';

let mongod;
let app;
let server;

// ── HTTP request helper ──
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {};
    if (options.body && options.headers === undefined) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const reqOptions = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: options.method || 'GET',
      headers: Object.assign({}, defaultHeaders, options.headers || {})
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (options.body !== undefined) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================================================');
  console.log('   Practical 7: Authentication & Middleware Pipeline Tests (24IT055)     ');
  console.log('========================================================================\n');

  // Start in-memory MongoDB
  mongod = await MongoMemoryServer.create({ instance: { port: 27018 } });
  const uri = mongod.getUri() + 'test-auth';
  process.env.MONGO_URI = uri;
  console.log('✔ MongoDB Server started at:', uri);

  // Require the app after setting env vars
  const serverModule = require('./server');
  app = serverModule.app;

  server = app.listen(3001, () => {
    console.log('✔ Express API listening on http://localhost:3001\n');
  });

  // Wait for mongoose connection
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) resolve();
    else mongoose.connection.once('open', resolve);
  });

  let passed = 0;
  let total = 0;
  let authToken = null;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(` \x1b[32m✔ PASS\x1b[0m [${total}] ${name}`);
      passed++;
    } catch (err) {
      console.log(` \x1b[31m✘ FAIL\x1b[0m [${total}] ${name}`);
      console.error(`   Error: ${err.message}`);
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  try {
    // ─── AUTH TESTS ───

    // 1. Register with valid data
    await test('POST /api/auth/register: creates user (201)', async () => {
      const res = await request('/api/auth/register', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123' }
      });
      assert(res.statusCode === 201, `Expected 201, got ${res.statusCode}`);
      assert(res.body.user, 'Response should contain user object');
      assert(res.body.user.email === 'test@example.com', 'Email should match');
      assert(!res.body.user.password, 'Password hash must NOT be in response');
    });

    // 2. Duplicate registration
    await test('POST /api/auth/register: rejects duplicate email (409)', async () => {
      const res = await request('/api/auth/register', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'anotherpass' }
      });
      assert(res.statusCode === 409, `Expected 409, got ${res.statusCode}`);
    });

    // 3. Register validation – missing email
    await test('POST /api/auth/register: rejects missing email (400)', async () => {
      const res = await request('/api/auth/register', {
        method: 'POST',
        body: { password: 'password123' }
      });
      assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
    });

    // 4. Register validation – short password
    await test('POST /api/auth/register: rejects short password (400)', async () => {
      const res = await request('/api/auth/register', {
        method: 'POST',
        body: { email: 'short@pass.com', password: '123' }
      });
      assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
    });

    // 5. Login with valid credentials
    await test('POST /api/auth/login: returns JWT token (200)', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123' }
      });
      assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
      assert(res.body.token, 'Response should contain token');
      assert(!res.body.user.password, 'Password hash must NOT be in response');
      authToken = res.body.token;
    });

    // 6. Login with wrong password
    await test('POST /api/auth/login: rejects wrong password (401)', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'wrongpassword' }
      });
      assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
      assert(res.body.message === 'Invalid credentials.', 'Should use generic message');
    });

    // 7. Login with non-existent email
    await test('POST /api/auth/login: rejects unknown email (401)', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'nobody@example.com', password: 'password123' }
      });
      assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
      assert(res.body.message === 'Invalid credentials.', 'Should use same generic message');
    });

    // 8. GET /api/auth/me with valid token
    await test('GET /api/auth/me: returns user profile (200)', async () => {
      const res = await request('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
      assert(res.body.user.email === 'test@example.com', 'Should return correct user');
      assert(!res.body.user.password, 'Password must not be exposed');
    });

    // ─── AUTH MIDDLEWARE TESTS ───

    // 9. No token → 401
    await test('GET /tasks: rejects request with no token (401)', async () => {
      const res = await request('/tasks');
      assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
    });

    // 10. Malformed header → 401
    await test('GET /tasks: rejects malformed Authorization header (401)', async () => {
      const res = await request('/tasks', {
        headers: { 'Authorization': 'NotBearer sometoken' }
      });
      assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
    });

    // 11. Tampered token → 401
    await test('GET /tasks: rejects tampered token (401)', async () => {
      const res = await request('/tasks', {
        headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2UifQ.tampered' }
      });
      assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
    });

    // 12. Expired token → 401
    await test('GET /tasks: rejects expired token (401)', async () => {
      // Sign a token that expires in 1 second, then wait
      const expiredToken = jwt.sign({ id: 'test' }, process.env.JWT_SECRET, { expiresIn: '1s' });
      await new Promise(r => setTimeout(r, 1500));
      const res = await request('/tasks', {
        headers: { 'Authorization': `Bearer ${expiredToken}` }
      });
      assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
      assert(res.body.message.includes('expired'), 'Should mention expiry');
    });

    // ─── PROTECTED TASK ROUTES (with valid token) ───

    let taskId = null;

    // 13. Create task with auth
    await test('POST /tasks: creates task with valid token (201)', async () => {
      const res = await request('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: { title: 'Authenticated Task', description: 'Created with JWT', priority: 'high' }
      });
      assert(res.statusCode === 201, `Expected 201, got ${res.statusCode}`);
      assert(res.body.title === 'Authenticated Task', 'Title should match');
      taskId = res.body._id;
    });

    // 14. Validation – missing title
    await test('POST /tasks: rejects missing title (400)', async () => {
      const res = await request('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: { description: 'No title provided' }
      });
      assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
      assert(res.body.message === 'Validation Error', 'Should return validation error');
    });

    // 15. Get all tasks with auth
    await test('GET /tasks: returns tasks with valid token (200)', async () => {
      const res = await request('/tasks', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
      assert(Array.isArray(res.body), 'Should return an array');
      assert(res.body.length >= 1, 'Should have at least 1 task');
    });

    // 16. Update task with auth
    await test('PUT /tasks/:id: updates task with valid token (200)', async () => {
      const res = await request(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: { completed: true }
      });
      assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
      assert(res.body.completed === true, 'Task should be marked completed');
    });

    // 17. Delete task with auth
    await test('DELETE /tasks/:id: deletes task with valid token (200)', async () => {
      const res = await request(`/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
      assert(res.body.message === 'Task deleted successfully', 'Should confirm deletion');
    });

    // ─── VERIFY BCRYPT HASH IN DATABASE ───

    // 18. Password is stored as bcrypt hash
    await test('Database: password is stored as bcrypt hash (starts with $2)', async () => {
      const User = require('./models/User');
      await User.findOne({ email: 'test@example.com' }).select('+password');
      // Since password is selected via Mongoose, we need the raw doc
      const rawDoc = await mongoose.connection.db.collection('users').findOne({ email: 'test@example.com' });
      assert(rawDoc.password.startsWith('$2'), `Expected bcrypt hash, got: ${rawDoc.password.substring(0, 10)}...`);
    });

  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongod) await mongod.stop();

    console.log('\n------------------------------------------------------------------------');
    console.log(` Results: ${passed} of ${total} tests passed (${Math.round((passed/total)*100)}%)`);
    console.log('------------------------------------------------------------------------\n');
    if (passed !== total) process.exit(1);
  }
}

runTests();

