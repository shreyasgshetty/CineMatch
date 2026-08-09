/**
 * server.js — Express Application Entry Point
 *
 * Architecture:
 * - Helmet:          Security HTTP headers
 * - CORS:            Allow client origin
 * - Morgan:          HTTP request logging
 * - express-limit:   Rate limiting (prevent API abuse)
 * - Routes:          Mounted at /api/*
 * - Error handler:   Centralized error responses
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const connectDB  = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// ── Route Imports ─────────────────────────────────────────────
const authRoutes           = require('./routes/auth');
const mediaRoutes          = require('./routes/media');
const onboardingRoutes     = require('./routes/onboarding');
const recommendationRoutes = require('./routes/recommendations');
const interactionRoutes    = require('./routes/interactions');
const userRoutes           = require('./routes/users');
const referenceRoutes      = require('./routes/reference');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ───────────────────────────────────────
connectDB();

// ── Security Middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow TMDB images
  contentSecurityPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────
// In development, allow any localhost port (Vite may pick 3000, 3001, 5173, etc.)
const devOrigin = /^http:\/\/localhost:\d+$/;
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : devOrigin,
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter for auth endpoints
  message: { error: 'Too many auth attempts. Please try again later.' },
});

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CineMatch API',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',            authLimiter, authRoutes);
app.use('/api/media',           apiLimiter, mediaRoutes);
app.use('/api/onboarding',      apiLimiter, onboardingRoutes);
app.use('/api/recommendations', apiLimiter, recommendationRoutes);
app.use('/api/interactions',    apiLimiter, interactionRoutes);
app.use('/api/users',           apiLimiter, userRoutes);
app.use('/api',                 apiLimiter, referenceRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 CineMatch API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI}\n`);
});

module.exports = app;
