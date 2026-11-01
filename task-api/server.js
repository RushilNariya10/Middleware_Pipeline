const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Task = require('./models/Task');
const User = require('./models/User');
const authMiddleware = require('./middleware/auth');
const { validateTask } = require('./middleware/validate');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai'); // Practical 13

// Practical 10 - event-driven background processing
const taskEvents = require('./events');
const { notifyTaskCreated } = require('./listeners'); // requiring registers all listeners
const {
  cache,
  isCacheEnabled,
  getActiveTTL,
  setActiveTTL,
  getCacheKey,
  recordHit,
  recordMiss,
  invalidateTasksCache,
  getDetailedStats,
  resetStats
} = require('./utils/cache');

const app = express();

// ── Global middleware ──
app.use(cors());

// Content-Type validation middleware (supports Practical 4 test 14)
app.use((req, res, next) => {
  if (['POST', 'PUT'].includes(req.method) && req.path.startsWith('/tasks')) {
    const contentType = req.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      return res.status(415).json({
        message: 'Unsupported Media Type: Content-Type must be application/json'
      });
    }
  }
  next();
});

app.use(express.json());

// Auto-seed default lab user for Practical 9 & testing
const DEMO_USER = {
  email: 'student24it055@charusat.edu.in',
  password: 'Password123!'
};

async function ensureDemoUser() {
  try {
    const existing = await User.findOne({ email: DEMO_USER.email.toLowerCase() });
    if (!existing) {
      await User.create(DEMO_USER);
      console.log('✔ Demo user auto-seeded:', DEMO_USER.email);
    }
  } catch (err) {
    // If table not ready or duplicate, safe to continue
  }
}

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    ensureDemoUser();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// ── Auth routes (public) ──
app.use('/api/auth', authRoutes);

// ── AI routes (Practical 13, protected inside the router) ──
app.use('/api/ai', aiRoutes);

// ── Simulated error route (Practical 4 test 17) ──
app.get('/test-error', (req, res, next) => {
  next(new Error('This is a simulated internal server error!'));
});

// ── Task routes (all protected by auth middleware) ──
// Pipeline order: Auth → Validation → Cache check → Controller

// GET - Get all tasks (Cached, optimized with .lean() for fast serialization and lower memory)
app.get('/tasks', authMiddleware, async (req, res, next) => {
  try {
    const key = getCacheKey('all');

    if (isCacheEnabled()) {
      const cached = cache.get(key);
      if (cached) {
        recordHit('all');
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
      recordMiss('all');
      res.setHeader('X-Cache', 'MISS');
    } else {
      res.setHeader('X-Cache', 'BYPASS');
    }

    const tasks = await Task.find().lean();

    if (isCacheEnabled()) {
      cache.set(key, tasks, getActiveTTL());
    }

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET - Get single task by ID (Supplementary Problem - Cached separately, optimized with .lean())
app.get('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
    // Check if ID is string like 'abc'
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (isNaN(Number(req.params.id))) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      return res.status(404).json({ message: 'Task not found' });
    }

    const key = getCacheKey('single', req.params.id);

    if (isCacheEnabled()) {
      const cached = cache.get(key);
      if (cached) {
        recordHit('single');
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
      recordMiss('single');
      res.setHeader('X-Cache', 'MISS');
    } else {
      res.setHeader('X-Cache', 'BYPASS');
    }

    const task = await Task.findById(req.params.id).lean();
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    if (isCacheEnabled()) {
      cache.set(key, task, getActiveTTL());
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST - Create a new task (Auth → Validate → Controller)
app.post('/tasks', authMiddleware, validateTask, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;
    const task = await Task.create({
      title,
      description,
      completed,
      priority
    });

    // Invalidate cache only AFTER successful database write
    if (isCacheEnabled()) {
      invalidateTasksCache();
    }

    // Practical 10 - EXPERIMENT ONLY (NOTIFY_MODE=inline): do the notification work
    // inside the route and WAIT for it, to measure what blocking costs the client.
    if (process.env.NOTIFY_MODE === 'inline') {
      await notifyTaskCreated(task, req.user.id);
      console.log(`[API] Response sent at ${new Date().toISOString()} (inline mode)`);
      return res.status(201).json(task);
    }

    // Default: respond FIRST, emit AFTER. emit() never makes the client wait.
    console.log(`[API] Response sent at ${new Date().toISOString()}`);
    res.on('finish', () => {
      console.log(`[API] Response fully flushed to client at ${new Date().toISOString()}`);
    });
    res.status(201).json(task);
    taskEvents.emit('task-created', task, req.user.id);
    return;
  } catch (err) {
    next(err);
  }
});

// PUT - Update a task (Auth → Validate → Controller, optimized with .lean())
app.put('/tasks/:id', authMiddleware, validateTask, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (isNaN(Number(req.params.id))) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).lean();
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Invalidate all-tasks and single-task cache only AFTER successful write
    if (isCacheEnabled()) {
      invalidateTasksCache(req.params.id);
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE - Delete a task
app.delete('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (isNaN(Number(req.params.id))) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Invalidate all-tasks and single-task cache only AFTER successful write
    if (isCacheEnabled()) {
      invalidateTasksCache(req.params.id);
    }

    res.status(200).json({
      message: 'Task deleted successfully',
      task
    });
    taskEvents.emit('task-deleted', task, req.user.id); // Practical 10 - second event
  } catch (err) {
    next(err);
  }
});

// ── Debug Endpoints (Supplementary Problem b) ──
// Protected by authMiddleware, disabled in production
app.get('/api/debug/cache-stats', authMiddleware, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      message: 'Debug endpoints are disabled in production environment.'
    });
  }
  const stats = getDetailedStats();
  res.status(200).json(stats);
});

app.post('/api/debug/cache-reset', authMiddleware, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      message: 'Debug endpoints are disabled in production environment.'
    });
  }
  const clearData = req.body && req.body.clearData === true;
  resetStats(clearData);
  res.status(200).json({
    message: 'Cache statistics successfully reset.',
    dataCleared: clearData,
    currentStats: getDetailedStats()
  });
});

app.post('/api/debug/cache-ttl', authMiddleware, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      message: 'Debug endpoints are disabled in production environment.'
    });
  }
  const ttlSeconds = parseInt(req.body && req.body.ttlSeconds, 10);
  if (!ttlSeconds || ttlSeconds <= 0) {
    return res.status(400).json({ message: 'Valid ttlSeconds positive integer is required.' });
  }
  setActiveTTL(ttlSeconds);
  res.status(200).json({
    message: `Cache TTL successfully configured to ${ttlSeconds} seconds.`,
    activeTTL: getActiveTTL()
  });
});

// 404 Undefined Route Handler (Practical 4 test 16)
app.use((req, res, next) => {
  // If request reached here and no route matched
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by their 4-argument signature
app.use((err, req, res, next) => {
  console.error(err);

  // Return clean, structured validation errors instead of raw Mongoose error objects
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Handle invalid MongoDB ObjectId format
  if (err.name === 'CastError') {
    return res.status(404).json({
      message: 'Task not found'
    });
  }

  // Handle duplicate key errors (e.g. unique email constraint)
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate value. A record with this data already exists.'
    });
  }

  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start Server
const PORT = process.env.PORT || 3000;

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
