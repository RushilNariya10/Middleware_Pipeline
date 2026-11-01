/**
 * Practical 13 - POST /api/ai/generate-description  (protected by the JWT middleware)
 * Graceful degradation: ANY AI failure returns HTTP 200 { fallback: true } so the
 * task form keeps working. Supplementary: 1 request / task / minute rate limit.
 */
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { generateTaskSuggestion } = require('../services/aiService');

const router = express.Router();
const WINDOW_MS = parseInt(process.env.AI_RATE_WINDOW_MS, 10) || 60 * 1000;
const lastCall = new Map(); // key: userId:taskKey -> timestamp

const FALLBACK_MSG = 'AI suggestions are unavailable right now. You can still write the description yourself.';

router.post('/generate-description', authMiddleware, async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title || title.length > 200) {
    return res.status(400).json({ message: 'A task title (1-200 characters) is required.' });
  }

  // Rate limit per task (taskId from the client, else the title text)
  const key = `${req.user.id}:${req.body.taskId || title.toLowerCase()}`;
  const now = Date.now();
  const prev = lastCall.get(key);
  if (prev && now - prev < WINDOW_MS) {
    const wait = Math.ceil((WINDOW_MS - (now - prev)) / 1000);
    return res.status(429).json({
      description: '', fallback: true, reason: 'rate_limited', retryAfterSeconds: wait,
      message: `Please wait ${wait}s before requesting another suggestion for this task.`
    });
  }
  lastCall.set(key, now);

  try {
    const { description, priority } = await generateTaskSuggestion(title);
    return res.status(200).json({ description, priority, fallback: false, aiGenerated: true });
  } catch (err) {
    console.error(`[AI] Suggestion failed: ${err.message}`); // log server-side only
    lastCall.delete(key); // a failed call should not burn the user's quota
    return res.status(200).json({ description: '', priority: null, fallback: true, reason: 'ai_unavailable', message: FALLBACK_MSG });
  }
});

module.exports = router;
