const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendEmail = require('../utils/sendEmail');
const {
  signAccessToken,
  signRefreshToken,
  verifyStoredRefreshToken,
  revokeRefreshToken,
  refreshCookieOptions,
} = require('../utils/generateTokens');

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

const userPublic = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  isVerified: user.isVerified,
});

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });

  // Email verification token (non-blocking for the flow)
  const rawToken = user.createVerifyToken();
  await user.save({ validateBeforeSave: false });
  const verifyUrl = `${FRONTEND}/verify-email/${rawToken}`;

  try {
    await sendEmail(user.email, 'welcome', { name: user.name });
    await sendEmail(user.email, 'verifyEmail', { name: user.name, url: verifyUrl });
  } catch (err) {
    console.error('Email send failed (register):', err.message);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await signRefreshToken(user);

  res
    .cookie('refreshToken', refreshToken, refreshCookieOptions())
    .status(201)
    .json({ success: true, accessToken, user: userPublic(user) });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  const accessToken = signAccessToken(user);
  const refreshToken = await signRefreshToken(user);

  res
    .cookie('refreshToken', refreshToken, refreshCookieOptions())
    .json({ success: true, accessToken, user: userPublic(user) });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  await revokeRefreshToken(token);
  res
    .clearCookie('refreshToken', { path: '/api/auth' })
    .json({ success: true, message: 'Logged out' });
});

/**
 * POST /api/auth/refresh-token — rotates the refresh token.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided');

  const { payload, stored } = await verifyStoredRefreshToken(token);

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive');

  // Rotate: delete old, issue new
  await stored.deleteOne();
  const newRefresh = await signRefreshToken(user);
  const accessToken = signAccessToken(user);

  res
    .cookie('refreshToken', newRefresh, refreshCookieOptions())
    .json({ success: true, accessToken, user: userPublic(user) });
});

/**
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    verifyToken: hashed,
    verifyTokenExpire: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, 'Verification link is invalid or has expired');

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified successfully' });
});

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond success to avoid email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
    });
  }

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${FRONTEND}/reset-password/${rawToken}`;

  try {
    await sendEmail(user.email, 'resetPassword', { name: user.name, url: resetUrl });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Failed to send reset email. Please try again later.');
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
});

/**
 * POST /api/auth/reset-password/:token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. You can now log in.' });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
