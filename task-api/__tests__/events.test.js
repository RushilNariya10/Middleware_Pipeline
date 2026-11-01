/** Practical 10 behaviour verified automatically (no DB needed). */
jest.mock('../models/User', () => ({
  findById: () => ({ select: async () => ({ email: 'tester@example.com' }) })
}));
const taskEvents = require('../events');
require('../listeners');

test('task-created handler logs title and assigned user', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  taskEvents.emit('task-created', { title: 'Write tests' }, 'user-1');
  await new Promise((r) => setTimeout(r, 50));
  const out = spy.mock.calls.map((c) => c[0]).join('\n');
  spy.mockRestore();
  expect(out).toContain('Write tests');
  expect(out).toContain('tester@example.com');
});

test('an error inside the handler is caught by the error listener (no crash)', async () => {
  process.env.SIMULATE_HANDLER_ERROR = 'true';
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  taskEvents.emit('task-created', { title: 'Boom' }, 'user-1');
  await new Promise((r) => setTimeout(r, 50));
  const out = spy.mock.calls.map((c) => c[0]).join('\n');
  spy.mockRestore();
  delete process.env.SIMULATE_HANDLER_ERROR;
  expect(out).toContain('[Event Error]');
});

