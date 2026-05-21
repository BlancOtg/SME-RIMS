const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true, minlength: 8, select: false },

    // SRS §2.3 — five user classes
    role: {
      type: String,
      enum: ['admin', 'accountant', 'vendor', 'client', 'sysadmin'],
      default: 'accountant',
    },

    isActive: { type: Boolean, default: true },

    // SRS NFR-SE-05 — lock after 5 failed login attempts
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil:         { type: Date, default: null },

    // SRS NFR-SE-04 — MFA for admin accounts
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret:  { type: String, select: false },

    lastLoginAt: { type: Date, default: null },

    // for password reset flow
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpires: { type: Date,   select: false },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password against hash
userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// SRS NFR-SE-05 — check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

// Increment failed attempts; lock after 5
userSchema.methods.recordFailedLogin = async function () {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
  }
  await this.save();
};

// Reset on successful login
userSchema.methods.recordSuccessfulLogin = async function () {
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  this.lastLoginAt = new Date();
  await this.save();
};

// Never expose password or secrets in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.mfaSecret;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
