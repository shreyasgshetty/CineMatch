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
// Origin checker:
//   dev  → any localhost port (Vite picks randomly)
//   prod → *.vercel.app preview URLs + explicit CLIENT_URL
const ALLOWED_ORIGINS = [
  /^http:\/\/localhost:\d+$/,                 // local dev
  /^https:\/\/.*\.vercel\.app$/,              // all Vercel preview & prod deployments
];
if (process.env.CLIENT_URL) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_URL); // exact custom domain if set
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const allowed = ALLOWED_ORIGINS.some(rule =>
      typeof rule === 'string' ? rule === origin : rule.test(origin)
    );

    if (allowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 300,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // Disable rate limiting in development
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 50,
  message: { error: 'Too many auth attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // Disable rate limiting in development
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
