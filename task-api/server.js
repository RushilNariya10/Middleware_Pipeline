const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Task = require('./models/Task');
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
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ── Auth routes (public) ──
app.use('/api/auth', authRoutes);

// ── AI routes (Practical 13, protected inside the router) ──
app.use('/api/ai', aiRoutes);

// ── Task routes (all protected by auth middleware) ──
// Pipeline order: Auth → Validation → Cache check → Controller

// GET - Get all tasks (Cached)
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

    const tasks = await Task.find();

    if (isCacheEnabled()) {
      cache.set(key, tasks, getActiveTTL());
    }

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET - Get single task by ID (Supplementary Problem - Cached separately)
app.get('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
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

    const task = await Task.findById(req.params.id);
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

// PUT - Update a task (Auth → Validate → Controller)
app.put('/tasks/:id', authMiddleware, validateTask, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
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
