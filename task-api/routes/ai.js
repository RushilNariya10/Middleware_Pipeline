const express = require('express');
const authMiddleware = require('../middleware/auth');
const { generateTaskSuggestion } = require('../services/aiService');

const router = express.Router();

// In-memory rate limiting map: taskId -> timestamp
const taskRateLimitMap = new Map();

/**
 * POST /api/ai/generate-description
 * JWT-protected route, per-task rate limit (1 request/minute), graceful fallback on failure.
 */
router.post('/generate-description', authMiddleware, async (req, res) => {
  const { title, taskId } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  // Rate limiting per taskId (1 request per minute)
  if (taskId) {
    const lastRequest = taskRateLimitMap.get(taskId);
    const now = Date.now();
    if (lastRequest && now - lastRequest < 60000) {
      return res.status(429).json({
        message: 'Rate limit exceeded for this task. Please wait a minute before requesting another suggestion.'
      });
    }
    taskRateLimitMap.set(taskId, now);
  }

  try {
    const suggestion = await generateTaskSuggestion(title);
    return res.status(200).json({
      description: suggestion.description || 'Review and complete task items.',
      priority: suggestion.priority || 'medium',
      fallback: false
    });
  } catch (err) {
    // Graceful degradation: return 200 with fallback notice instead of crashing
    return res.status(200).json({
      description: `Action items for "${title}": organize deliverables, coordinate next steps, and review progress.`,
      priority: 'medium',
      fallback: true,
      error: err.message
    });
  }
});

module.exports = router;
