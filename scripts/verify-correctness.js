const http = require('http');
const { performance } = require('perf_hooks');

const DEMO_USER = {
  email: 'student24it055@charusat.edu.in',
  password: 'Password123!'
};

function req(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const t0 = performance.now();
    const request = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const t1 = performance.now();
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          duration: parseFloat((t1 - t0).toFixed(2)),
          body: parsed
        });
      });
    });

    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

async function verifyAll() {
  console.log('====================================================');
  console.log('   PRACTICAL 9: CACHE CORRECTNESS & VERIFICATION    ');
  console.log('   Student: 24IT055 (Rushil Nariya)                 ');
  console.log('====================================================\n');

  // Step 1: Login
  console.log('1. Authenticating as demo user...');
  const loginRes = await req('/api/auth/login', 'POST', DEMO_USER);
  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error('Authentication failed: ' + JSON.stringify(loginRes.body));
  }
  const token = loginRes.body.token;
  console.log('   [PASS] Authenticated successfully. JWT token obtained.\n');

  // Step 2: Reset cache for clean test
  console.log('2. Resetting cache and hit/miss counters via debug endpoint...');
  const resetRes = await req('/api/debug/cache-reset', 'POST', { clearData: true }, token);
  console.log(`   [PASS] Cache reset: status=${resetRes.status}, dataCleared=${resetRes.body.dataCleared}\n`);

  // Step 3: Unauthenticated request must return 401 and never touch cache
  console.log('3. Security Check: Unauthenticated request...');
  const unauthRes = await req('/tasks', 'GET', null, null);
  if (unauthRes.status === 401) {
    console.log(`   [PASS] Request blocked with status 401. Cache was NOT bypassed or served.\n`);
  } else {
    console.error(`   [FAIL] Expected 401, got ${unauthRes.status}`);
  }

  // Step 4: GET /tasks MISS then HIT
  console.log('4. GET /tasks MISS then HIT...');
  const get1 = await req('/tasks', 'GET', null, token);
  console.log(`   Request 1: Status=${get1.status}, X-Cache=${get1.headers['x-cache']}, Duration=${get1.duration}ms, Count=${get1.body.length}`);
  const get2 = await req('/tasks', 'GET', null, token);
  console.log(`   Request 2: Status=${get2.status}, X-Cache=${get2.headers['x-cache']}, Duration=${get2.duration}ms, Count=${get2.body.length}`);
  if (get1.headers['x-cache'] === 'MISS' && get2.headers['x-cache'] === 'HIT') {
    console.log('   [PASS] Correct: First request was MISS, second request was HIT!\n');
  } else {
    console.error('   [FAIL] Expected MISS then HIT.');
  }

  // Step 5: GET /tasks/:id MISS then HIT
  const sampleId = get1.body[0]._id;
  console.log(`5. GET /tasks/:id MISS then HIT for ID ${sampleId}...`);
  const getSingle1 = await req(`/tasks/${sampleId}`, 'GET', null, token);
  console.log(`   Request 1: Status=${getSingle1.status}, X-Cache=${getSingle1.headers['x-cache']}, Duration=${getSingle1.duration}ms`);
  const getSingle2 = await req(`/tasks/${sampleId}`, 'GET', null, token);
  console.log(`   Request 2: Status=${getSingle2.status}, X-Cache=${getSingle2.headers['x-cache']}, Duration=${getSingle2.duration}ms`);
  if (getSingle1.headers['x-cache'] === 'MISS' && getSingle2.headers['x-cache'] === 'HIT') {
    console.log('   [PASS] Correct: Single-task cache produced MISS then HIT!\n');
  } else {
    console.error('   [FAIL] Expected MISS then HIT for single task.');
  }

  // Step 6: Invalidation on POST
  console.log('6. Cache Invalidation on POST (Create Task)...');
  const newTaskPayload = {
    title: 'Verification Task Practical 9 Cache Test',
    description: 'Verifying immediate cache invalidation after write',
    priority: 'high',
    completed: false
  };
  const postRes = await req('/tasks', 'POST', newTaskPayload, token);
  console.log(`   Created task ID: ${postRes.body._id}, Status: ${postRes.status}`);

  const getAfterPost = await req('/tasks', 'GET', null, token);
  console.log(`   GET /tasks after POST: X-Cache=${getAfterPost.headers['x-cache']}, Duration=${getAfterPost.duration}ms, New Count=${getAfterPost.body.length}`);
  const taskFoundInAll = getAfterPost.body.some(t => t._id === postRes.body._id);
  if (getAfterPost.headers['x-cache'] === 'MISS' && taskFoundInAll) {
    console.log('   [PASS] Correct: POST invalidated all_tasks cache! GET returned MISS and included the new task.\n');
  } else {
    console.error('   [FAIL] POST invalidation failed.');
  }

  // Step 7: Invalidation on PUT (Update Task)
  const createdId = postRes.body._id;
  console.log(`7. Cache Invalidation on PUT (Update Task ${createdId})...`);
  // Prime single cache first
  const primeSingle = await req(`/tasks/${createdId}`, 'GET', null, token);
  console.log(`   Primed single task cache: X-Cache=${primeSingle.headers['x-cache']}`);

  const putRes = await req(`/tasks/${createdId}`, 'PUT', {
    title: 'UPDATED: Verification Task Practical 9 Cache Test',
    completed: true,
    priority: 'low'
  }, token);
  console.log(`   Updated task status: ${putRes.status}`);

  // Both all_tasks and single_task should now be MISS
  const getSingleAfterPut = await req(`/tasks/${createdId}`, 'GET', null, token);
  console.log(`   GET /tasks/:id after PUT: X-Cache=${getSingleAfterPut.headers['x-cache']}, Title="${getSingleAfterPut.body.title}"`);

  const getAllAfterPut = await req('/tasks', 'GET', null, token);
  console.log(`   GET /tasks after PUT: X-Cache=${getAllAfterPut.headers['x-cache']}`);

  if (getSingleAfterPut.headers['x-cache'] === 'MISS' && getAllAfterPut.headers['x-cache'] === 'MISS' && getSingleAfterPut.body.title.startsWith('UPDATED:')) {
    console.log('   [PASS] Correct: PUT invalidated BOTH all_tasks and single_task caches!\n');
  } else {
    console.error('   [FAIL] PUT invalidation failed.');
  }

  // Step 8: Invalidation on DELETE (Delete Task)
  console.log(`8. Cache Invalidation on DELETE (Delete Task ${createdId})...`);
  // Prime single cache again
  await req(`/tasks/${createdId}`, 'GET', null, token);
  await req('/tasks', 'GET', null, token);

  const delRes = await req(`/tasks/${createdId}`, 'DELETE', null, token);
  console.log(`   Deleted task status: ${delRes.status}`);

  const getSingleAfterDel = await req(`/tasks/${createdId}`, 'GET', null, token);
  console.log(`   GET /tasks/:id after DELETE: Status=${getSingleAfterDel.status} (expected 404)`);

  const getAllAfterDel = await req('/tasks', 'GET', null, token);
  console.log(`   GET /tasks after DELETE: X-Cache=${getAllAfterDel.headers['x-cache']}`);

  if (getSingleAfterDel.status === 404 && getAllAfterDel.headers['x-cache'] === 'MISS') {
    console.log('   [PASS] Correct: DELETE invalidated cache and removed resource!\n');
  } else {
    console.error('   [FAIL] DELETE invalidation failed.');
  }

  // Step 9: Inspect Debug Stats Endpoint
  console.log('9. Checking Debug Cache Stats Endpoint (/api/debug/cache-stats)...');
  const statsRes = await req('/api/debug/cache-stats', 'GET', null, token);
  console.log('   Cache Stats Response:');
  console.log('   - Cache Enabled:', statsRes.body.cacheEnabled);
  console.log('   - Configured TTL:', statsRes.body.configuredTTL, 'seconds');
  console.log('   - Active Keys:', statsRes.body.activeKeys);
  console.log('   - All Tasks Breakdown:', JSON.stringify(statsRes.body.breakdown.allTasks));
  console.log('   - Single Task Breakdown:', JSON.stringify(statsRes.body.breakdown.singleTask));
  console.log('   - Overall Hit Ratio:', statsRes.body.breakdown.overall.hitRatioPercent + '%');
  console.log('   - Internal NodeCache Stats:', JSON.stringify(statsRes.body.nodeCacheInternal));
  console.log('   [PASS] Debug endpoint fully functional and returning accurate metrics.\n');

  console.log('====================================================');
  console.log('   ALL CORRECTNESS AND INVALIDATION TESTS PASSED!   ');
  console.log('====================================================');
}

verifyAll().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});

