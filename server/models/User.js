const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' }, // "Home", "Work"
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zip: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    avatar: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },
    phone: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    addresses: [addressSchema],
    verifyToken: String,
    verifyTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// ── Hooks ──────────────────────────────────────────────────────────────
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance methods ───────────────────────────────────────────────────
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return rawToken;
};

userSchema.methods.createVerifyToken = function createVerifyToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.verifyToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.verifyTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return rawToken;
};

module.exports = mongoose.model('User', userSchema);
