const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_EXPIRE = process.env.JWT_ACCESS_EXPIRE || '15m';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

/** Sign a short-lived access token. */
const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRE,
  });

/** Sign a long-lived refresh token and persist it for rotation/revocation. */
const signRefreshToken = async (user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRE,
  });

  // Persist a hash so a leaked DB doesn't expose usable tokens.
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const decoded = jwt.decode(token);

  await RefreshToken.create({
    user: user._id,
    token: hashed,
    expiresAt: new Date(decoded.exp * 1000),
  });

  return token;
};

/** Verify a refresh token against its stored hash; returns the DB record. */
const verifyStoredRefreshToken = async (token) => {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const stored = await RefreshToken.findOne({ token: hashed, user: payload.id });
  if (!stored) {
    const err = new Error('Refresh token has been revoked');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return { payload, stored };
};

/** Revoke (delete) a stored refresh token by its raw value. */
const revokeRefreshToken = async (token) => {
  if (!token) return;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  await RefreshToken.deleteOne({ token: hashed });
};

/** Compute the cookie maxAge (ms) for the refresh token. */
const refreshCookieMaxAge = () => {
  const days = parseInt(REFRESH_EXPIRE, 10) || 7;
  return days * 24 * 60 * 60 * 1000;
};

/** Standard cookie options for the httpOnly refresh-token cookie. */
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: refreshCookieMaxAge(),
  path: '/api/auth',
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyStoredRefreshToken,
  revokeRefreshToken,
  refreshCookieOptions,
};
