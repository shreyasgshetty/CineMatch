/**
 * User Model
 *
 * The `preferences` subdocument is the core of the recommendation system.
 * It stores weighted values for genres, actors, and directors.
 *
 * Weight range: -1.0 (strong dislike) to +1.0 (strong love)
 * Default weight: 0 (neutral)
 *
 * These weights are updated after every user interaction using:
 * newWeight = oldWeight + LEARNING_RATE * feedbackSignal
 *
 * DSA note: genres, actors, directors use Map types (MongoDB documents)
 * which provide O(1) lookup by key — equivalent to a HashMap.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Preferences Sub-Schema ────────────────────────────────────
const PreferencesSchema = new mongoose.Schema({
  languages: {
    type: [String],  // e.g. ['kn', 'en', 'hi']
    default: [],
  },
  industries: {
    type: [String],  // e.g. ['Sandalwood', 'Hollywood']
    default: [],
  },
  genres: {
    type: Map,
    of: Number,      // { "Action": 0.85, "Thriller": 0.72 }
    default: {},
  },
  actors: {
    type: Map,
    of: Number,      // { "12345": 0.90, "67890": -0.30 }  (keyed by TMDB person ID as string)
    default: {},
  },
  directors: {
    type: Map,
    of: Number,
    default: {},
  },
}, { _id: false });

// ── User Schema ───────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // Never returned in queries by default
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  onboardingStep: {
    type: Number,
    default: 0,  // 0=not started, 1=languages done, 2=movies done, etc.
  },
  preferences: {
    type: PreferencesSchema,
    default: () => ({}),
  },
}, {
  timestamps: true, // adds createdAt, updatedAt automatically
});

// ── Indexes ────────────────────────────────────────────────────
// Note: email index is already created by unique:true above — no need to repeat it.

// ── Hash password before save ─────────────────────────────────
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// ── Instance Method: Compare Password ─────────────────────────
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ── Instance Method: Safe user object (no passwordHash) ───────
UserSchema.methods.toSafeObject = function() {
  return {
    _id:                this._id,
    name:               this.name,
    email:              this.email,
    onboardingCompleted: this.onboardingCompleted,
    onboardingStep:     this.onboardingStep,
    preferences:        this.preferences,
    createdAt:          this.createdAt,
    updatedAt:          this.updatedAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
