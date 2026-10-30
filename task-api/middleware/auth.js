const jwt = require('jsonwebtoken');

/**
 * Authentication middleware.
 * Reads the Authorization header, extracts a Bearer token, and verifies it.
 * On success, attaches the decoded payload to req.user and calls next().
 * On failure (missing header, malformed format, invalid/expired token),
 * returns 401 without crashing the server.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  // Check that the header exists and follows "Bearer <token>" format
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Access denied. No token provided.'
    });
  }

  const token = header.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Access denied. Malformed authorization header.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Differentiate between expired and otherwise invalid tokens
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      message: 'Invalid token. Authentication failed.'
    });
  }
}

module.exports = authMiddleware;

