/**
 * Server-side validation and sanitisation middleware.
 *
 * These functions run BEFORE the request reaches the controller or the database,
 * catching malformed payloads early and returning descriptive 400 errors.
 */

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Strip HTML tags and trim whitespace from a string value. */
function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').trim();
}

/** Simple email format check (RFC-5322 simplified). */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ────────────────────────────────────────────────────────────────
// Registration payload validator
// ────────────────────────────────────────────────────────────────

function validateRegister(req, res, next) {
  const errors = [];

  // Sanitize inputs
  if (req.body.email !== undefined) {
    req.body.email = sanitize(req.body.email);
  }

  // Email checks
  if (!req.body.email) {
    errors.push('Email is required.');
  } else if (!isValidEmail(req.body.email)) {
    errors.push('Please provide a valid email address.');
  }

  // Password checks
  if (!req.body.password) {
    errors.push('Password is required.');
  } else if (typeof req.body.password !== 'string') {
    errors.push('Password must be a string.');
  } else if (req.body.password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation Error', errors });
  }

  next();
}

// ────────────────────────────────────────────────────────────────
// Login payload validator
// ────────────────────────────────────────────────────────────────

function validateLogin(req, res, next) {
  const errors = [];

  if (req.body.email !== undefined) {
    req.body.email = sanitize(req.body.email);
  }

  if (!req.body.email) {
    errors.push('Email is required.');
  } else if (!isValidEmail(req.body.email)) {
    errors.push('Please provide a valid email address.');
  }

  if (!req.body.password) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation Error', errors });
  }

  next();
}

// ────────────────────────────────────────────────────────────────
// Task creation / update validator
// ────────────────────────────────────────────────────────────────

function validateTask(req, res, next) {
  const errors = [];
  const { title, description, priority, completed } = req.body;

  // Sanitize string fields
  if (title !== undefined) req.body.title = sanitize(title);
  if (description !== undefined) req.body.description = sanitize(description);

  // For POST (create), title is mandatory
  if (req.method === 'POST') {
    if (!req.body.title) {
      errors.push('Task title is required.');
    }
  }

  // Length checks (only when field is provided)
  if (req.body.title !== undefined && typeof req.body.title === 'string') {
    if (req.body.title.length > 200) {
      errors.push('Task title must not exceed 200 characters.');
    }
  }

  if (req.body.description !== undefined && typeof req.body.description === 'string') {
    if (req.body.description.length > 1000) {
      errors.push('Task description must not exceed 1000 characters.');
    }
  }

  // Priority must be one of the allowed values (if provided)
  if (priority !== undefined) {
    const allowed = ['low', 'medium', 'high'];
    if (!allowed.includes(priority)) {
      errors.push(`Priority must be one of: ${allowed.join(', ')}.`);
    }
  }

  // Completed must be a boolean (if provided)
  if (completed !== undefined && typeof completed !== 'boolean') {
    errors.push('Completed must be a boolean value.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation Error', errors });
  }

  next();
}

module.exports = { validateRegister, validateLogin, validateTask };

