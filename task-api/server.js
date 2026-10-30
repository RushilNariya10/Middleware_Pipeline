const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Task = require('./models/Task');
const authMiddleware = require('./middleware/auth');
const { validateTask } = require('./middleware/validate');
const authRoutes = require('./routes/auth');
const {
  cache,
  isCacheEnabled,
  getCacheKey,
  recordHit,
  recordMiss
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
      cache.set(key, tasks);
    }

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET - Get single task by ID (Supplementary Problem)
app.get('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
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
    res.status(201).json(task);
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
    res.status(200).json({
      message: 'Task deleted successfully',
      task
    });
  } catch (err) {
    next(err);
  }
});

// Global Error Handler
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
