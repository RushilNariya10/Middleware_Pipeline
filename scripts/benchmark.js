const http = require('http');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000';
const DEMO_USER = {
  email: 'student24it055@charusat.edu.in',
  password: 'Password123!'
};

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        let body;
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          duration: parseFloat(duration.toFixed(2)),
          body
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runBenchmark(mode = 'uncached') {
  console.log(`=== Starting ${mode.toUpperCase()} Benchmark ===`);

  // 1. Authenticate to get JWT token
  console.log(`Authenticating as ${DEMO_USER.email}...`);
  const loginRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, DEMO_USER);

  if (loginRes.statusCode !== 200 || !loginRes.body.token) {
    console.error('Login failed:', loginRes.statusCode, loginRes.body);
    process.exit(1);
  }

  const token = loginRes.body.token;
  console.log('Login successful! JWT acquired.');

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch all tasks once to inspect dataset and obtain a sample ID
  console.log('Fetching sample task for single-task test...');
  const initialFetch = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/tasks',
    method: 'GET',
    headers: authHeaders
  });

  if (initialFetch.statusCode !== 200 || !Array.isArray(initialFetch.body)) {
    console.error('Failed to fetch tasks:', initialFetch.statusCode, initialFetch.body);
    process.exit(1);
  }

  const taskCount = initialFetch.body.length;
  const sampleTaskId = initialFetch.body[0]._id;
  console.log(`Total tasks retrieved: ${taskCount}. Using sample task ID: ${sampleTaskId}`);

  // 3. Measure GET /tasks (all tasks) - 10 iterations
  console.log('\nBenchmarking GET /tasks (All Tasks) - 10 iterations...');
  const allTasksReadings = [];
  for (let i = 1; i <= 10; i++) {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/tasks',
      method: 'GET',
      headers: authHeaders
    });
    allTasksReadings.push({
      iteration: i,
      durationMs: res.duration,
      statusCode: res.statusCode,
      xCache: res.headers['x-cache'] || 'NONE',
      itemCount: Array.isArray(res.body) ? res.body.length : 0
    });
    console.log(`  Run ${i.toString().padStart(2, ' ')}: ${res.duration.toFixed(2)} ms [Status: ${res.statusCode}, X-Cache: ${res.headers['x-cache'] || 'NONE'}]`);
    // brief delay between requests to simulate real client intervals
    await new Promise(r => setTimeout(r, 100));
  }

  // 4. Measure GET /tasks/:id (single task) - 10 iterations
  console.log(`\nBenchmarking GET /tasks/${sampleTaskId} (Single Task) - 10 iterations...`);
  const singleTaskReadings = [];
  for (let i = 1; i <= 10; i++) {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/tasks/${sampleTaskId}`,
      method: 'GET',
      headers: authHeaders
    });
    singleTaskReadings.push({
      iteration: i,
      durationMs: res.duration,
      statusCode: res.statusCode,
      xCache: res.headers['x-cache'] || 'NONE',
      taskId: sampleTaskId
    });
    console.log(`  Run ${i.toString().padStart(2, ' ')}: ${res.duration.toFixed(2)} ms [Status: ${res.statusCode}, X-Cache: ${res.headers['x-cache'] || 'NONE'}]`);
    await new Promise(r => setTimeout(r, 100));
  }

  // Calculate statistics
  function computeStats(readings) {
    const cold = readings[0].durationMs;
    const warmDurations = readings.slice(1).map(r => r.durationMs);
    const allDurations = readings.map(r => r.durationMs);
    const sum = arr => arr.reduce((a, b) => a + b, 0);
    const avg = arr => parseFloat((sum(arr) / arr.length).toFixed(2));
    const min = arr => Math.min(...arr);
    const max = arr => Math.max(...arr);

    return {
      totalRuns: readings.length,
      coldDurationMs: cold,
      warmOnly: {
        min: min(warmDurations),
        avg: avg(warmDurations),
        max: max(warmDurations)
      },
      overall: {
        min: min(allDurations),
        avg: avg(allDurations),
        max: max(allDurations)
      },
      readings
    };
  }

  const allTasksStats = computeStats(allTasksReadings);
  const singleTaskStats = computeStats(singleTaskReadings);

  const reportData = {
    mode,
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      datasetSize: taskCount,
      sampleTaskId,
      database: 'MongoDB Atlas (M0 Free Tier)',
      authScope: 'Global Task Collection with JWT Auth Pipeline'
    },
    endpoints: {
      allTasks: {
        route: 'GET /tasks',
        stats: allTasksStats
      },
      singleTask: {
        route: 'GET /tasks/:id',
        stats: singleTaskStats
      }
    }
  };

  // Ensure docs/metrics exists
  const metricsDir = path.join(__dirname, '../docs/metrics');
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }

  const jsonPath = path.join(metricsDir, `baseline-${mode}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`\nSaved JSON metrics: ${jsonPath}`);

  // Generate Markdown report
  const mdPath = path.join(metricsDir, `baseline-${mode}.md`);
  let mdContent = `# Baseline Performance Report (${mode.toUpperCase()})

- **Practical:** Practical 9 - In-Memory Caching and Query Optimization
- **Student ID:** 24IT055 (Rushil Nariya)
- **Dataset Size:** ${taskCount} task documents
- **Timestamp:** ${reportData.timestamp}
- **Database:** MongoDB Atlas (M0 Tier)
- **Cache Status:** ${mode === 'uncached' ? 'DISABLED (Direct MongoDB Atlas Queries)' : 'ENABLED (node-cache In-Memory)'}

---

## 1. GET /tasks (All ${taskCount} Tasks)

### Summary Statistics
- **Cold Request (Run 1):** ${allTasksStats.coldDurationMs} ms
- **Warm Requests Avg (Runs 2–10):** ${allTasksStats.warmOnly.avg} ms
- **Warm Min:** ${allTasksStats.warmOnly.min} ms | **Warm Max:** ${allTasksStats.warmOnly.max} ms
- **Overall Avg (Runs 1–10):** ${allTasksStats.overall.avg} ms

### Detailed Readings
| Run # | Response Time (ms) | HTTP Status | Cache Header | Result / Observation |
|---|---|---|---|---|
`;

  allTasksReadings.forEach(r => {
    const isCold = r.iteration === 1;
    mdContent += `| Run ${r.iteration} | ${r.durationMs.toFixed(2)} ms | ${r.statusCode} | \`${r.xCache}\` | ${isCold ? 'Cold DB query / network fetch' : 'Warm DB query'} (${r.itemCount} tasks) |\n`;
  });

  mdContent += `\n---

## 2. GET /tasks/:id (Single Task: \`${sampleTaskId}\`)

### Summary Statistics
- **Cold Request (Run 1):** ${singleTaskStats.coldDurationMs} ms
- **Warm Requests Avg (Runs 2–10):** ${singleTaskStats.warmOnly.avg} ms
- **Warm Min:** ${singleTaskStats.warmOnly.min} ms | **Warm Max:** ${singleTaskStats.warmOnly.max} ms
- **Overall Avg (Runs 1–10):** ${singleTaskStats.overall.avg} ms

### Detailed Readings
| Run # | Response Time (ms) | HTTP Status | Cache Header | Result / Observation |
|---|---|---|---|---|
`;

  singleTaskReadings.forEach(r => {
    const isCold = r.iteration === 1;
    mdContent += `| Run ${r.iteration} | ${r.durationMs.toFixed(2)} ms | ${r.statusCode} | \`${r.xCache}\` | ${isCold ? 'Cold single-doc query' : 'Warm single-doc query'} |\n`;
  });

  mdContent += `\n---

## 3. Analysis & Observations
1. **Database Query Overhead:** Every request triggers a complete network round-trip from the Node.js application to the MongoDB Atlas cluster over HTTPS/TLS, followed by Mongoose BSON document deserialization.
2. **Payload Impact:** Serializing and transmitting ${taskCount} tasks takes ~${allTasksStats.warmOnly.avg} ms, which is order of magnitudes slower than single-task retrieval (~${singleTaskStats.warmOnly.avg} ms).
3. **Database Resource Consumption:** Uncached reads continuously place CPU and network load on the database server, demonstrating the critical need for an in-memory caching tier.
`;

  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`Saved Markdown report: ${mdPath}`);
  console.log('Benchmark completed successfully!');
}

const modeArg = process.argv[2] || 'uncached';
runBenchmark(modeArg).catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
