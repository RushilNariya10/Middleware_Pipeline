/**
 * Practical 10 - experiment runner. Usage: node scripts/event-demo.js <event|inline|error|delete>
 * Starts the real server, creates a task through the HTTP API and prints
 * client-side and server-side timestamps so the ordering can be compared.
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const mode = process.argv[2] || 'event';
const env = { ...process.env, PORT: '3000' };
env.NOTIFICATION_DELAY_MS = mode === 'error' ? '500' : mode === 'delete' ? '0' : '2000';
if (mode === 'inline') env.NOTIFY_MODE = 'inline';
if (mode === 'error') env.SIMULATE_HANDLER_ERROR = 'true';
console.log(`[SETUP]  mode=${mode}  NOTIFY_MODE=${env.NOTIFY_MODE || 'event'}  handler delay=${env.NOTIFICATION_DELAY_MS} ms`);

const srv = spawn(process.execPath, ['server.js'], { env, cwd: path.join(__dirname, '..') });
const pipe = (d) => d.toString().split('\n').filter(Boolean).forEach((l) => console.log('[SERVER] ' + l));
srv.stdout.on('data', pipe); srv.stderr.on('data', pipe);

function call(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const t0 = process.hrtime.bigint();
    const req = http.request({ host: '127.0.0.1', port: 3000, path, method, headers: {
      'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }),
      ...(data && { 'Content-Length': Buffer.byteLength(data) }) } }, (res) => {
      let buf = ''; res.on('data', (c) => (buf += c));
      res.on('end', () => { let json; try { json = JSON.parse(buf); } catch { /* ignore */ }
        resolve({ status: res.statusCode, json, ms: Number(process.hrtime.bigint() - t0) / 1e6 }); });
    });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(port = 3000, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const r = http.get(`http://127.0.0.1:${port}/tasks`, { headers: { 'Authorization': 'test' } }, () => {
          resolve();
        });
        r.on('error', reject);
      });
      return;
    } catch {
      await wait(500);
    }
  }
}

(async () => {
  await waitForServer(3000);
  const cred = { email: 'rushil@charusat.edu.in', password: 'secret123' };
  await call('POST', '/api/auth/register', cred);
  const { json: { token } } = await call('POST', '/api/auth/login', cred);
  const title = mode === 'delete' ? 'Task to be deleted' : 'Prepare AWDF viva';
  console.log(`[CLIENT] POST /tasks sent at     ${new Date().toISOString()}`);
  const r = await call('POST', '/tasks', { title, description: 'Revise events', priority: 'high' }, token);
  console.log(`[CLIENT] HTTP ${r.status} received at ${new Date().toISOString()}  -> client waited ${r.ms.toFixed(1)} ms`);
  if (mode === 'delete') {
    await wait(300);
    console.log(`[CLIENT] DELETE /tasks/${r.json._id} sent at ${new Date().toISOString()}`);
    const d = await call('DELETE', `/tasks/${r.json._id}`, null, token);
    console.log(`[CLIENT] HTTP ${d.status} received at ${new Date().toISOString()}  -> client waited ${d.ms.toFixed(1)} ms`);
  }
  await wait(mode === 'inline' ? 500 : 2800);
  console.log(`[CLIENT] demo finished at        ${new Date().toISOString()}`);
  srv.kill(); process.exit(0);
})().catch((e) => { console.error(e); srv.kill(); process.exit(1); });
