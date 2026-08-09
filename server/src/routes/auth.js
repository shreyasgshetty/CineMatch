/**
 * Auth Routes — /api/auth
 *
 * POST /api/auth/register  → Create account, return JWT
 * POST /api/auth/login     → Verify credentials, return JWT
 * GET  /api/auth/me        → Return current user (requires auth)
 */

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User   = require('../models/User');
const auth   = require('../middleware/auth');

// ── Helper: Generate JWT ──────────────────────────────────────
const signToken = (user) => jwt.sign(
  { userId: user._id, name: user.name, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// ── Register ──────────────────────────────────────────────────
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;

      // Check for existing user
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }

      // Create user — password is hashed by pre-save hook
      const user = await User.create({
        name,
        email,
        passwordHash: password, // Pre-save hook hashes this
      });

      const token = signToken(user);

      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: user.toSafeObject(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── Login ─────────────────────────────────────────────────────
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      // Fetch user WITH passwordHash (select: false means we must explicitly include it)
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = signToken(user);

      res.json({
        message: 'Login successful',
        token,
        user: user.toSafeObject(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── Get Current User ──────────────────────────────────────────
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
