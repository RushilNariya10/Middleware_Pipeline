// listeners.js - Practical 10: background handlers (registered once at start-up)
const taskEvents = require('./events');
const User = require('./models/User');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const delayMs = () => parseInt(process.env.NOTIFICATION_DELAY_MS, 10) || 0;

// Core notification logic (also callable directly for the "inline" experiment)
async function notifyTaskCreated(task, userId) {
  const started = new Date().toISOString();
  console.log(`[Notification] Handler started   at ${started} (task "${task.title}")`);
  const t0 = Date.now();

  if (delayMs() > 0) await sleep(delayMs());               // simulated slow work (email/push)
  if (process.env.SIMULATE_HANDLER_ERROR === 'true') {
    throw new Error('Simulated failure inside task-created handler');
  }

  let assigned = 'unknown';
  try {
    const user = await User.findById(userId).select('email');
    if (user) assigned = user.email;
  } catch { /* lookup failure must never break the notification */ }

  console.log(
    `[Notification] Task "${task.title}" created | assigned user: ${assigned} | ` +
    `completed at ${new Date().toISOString()} (handler took ${Date.now() - t0} ms)`
  );
}

// Listener 1: task-created. Errors are routed to the 'handler-error' event.
taskEvents.on('task-created', (task, userId) => {
  notifyTaskCreated(task, userId).catch((err) => taskEvents.emit('handler-error', 'task-created', err));
});

// Listener 2 (supplementary): task-deleted
taskEvents.on('task-deleted', async (task, userId) => {
  try {
    const user = await User.findById(userId).select('email');
    console.log(
      `[Cleanup] Task "${task.title}" (id ${task._id}) was deleted by ` +
      `${user ? user.email : 'unknown'} at ${new Date().toISOString()}`
    );
  } catch (err) {
    taskEvents.emit('handler-error', 'task-deleted', err);
  }
});

// Listener 3 (supplementary): central error listener.
// A custom name is used on purpose - an unhandled event literally named 'error' would crash Node.
taskEvents.on('handler-error', (eventName, err) => {
  console.error(`[Event Error] Handler for "${eventName}" failed at ${new Date().toISOString()}: ${err.message}`);
});

module.exports = { notifyTaskCreated };

