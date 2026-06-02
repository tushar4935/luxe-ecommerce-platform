const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Require a valid access token. Attaches the live user document to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. No token provided.');
  }

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) throw new ApiError(401, 'User no longer exists.');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated.');

  req.user = user;
  next();
});

/**
 * Require the authenticated user to be an admin. Use after `protect`.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  throw new ApiError(403, 'Admin access required.');
};

/**
 * Optional auth — attaches req.user if a valid token is present, but never
 * blocks the request. Useful for endpoints that personalize when logged in.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    } catch (_) {
      /* ignore — treat as guest */
    }
  }
  next();
});

module.exports = { protect, adminOnly, optionalAuth };
