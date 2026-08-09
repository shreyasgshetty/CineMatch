/**
 * Media Routes — /api/media
 *
 * GET /api/media               → List media (paginated, filterable)
 * GET /api/media/search        → Full-text + filter search
 * GET /api/media/:id           → Single media details
 *
 * Note: Media is seeded by the data ingestion script (scripts/ingest.js)
 * not created via API. These routes are read-only for the client.
 *
 * TMDB API key stays on the backend — the frontend never touches TMDB directly.
 */

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Media   = require('../models/Media');

// ── List Media ────────────────────────────────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      type, language, industry, genre,
      sortBy = 'popularity', order = 'desc',
    } = req.query;

    const query = {};
    if (type)     query.type = type;
    if (language) query.originalLanguage = language;
    if (industry) query.industry = industry;
    if (genre)    query.genres = { $in: [genre] };

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = ['popularity', 'rating', 'releaseYear'].includes(sortBy)
      ? sortBy : 'popularity';

    const skip = (Number(page) - 1) * Number(limit);
    const [media, total] = await Promise.all([
      Media.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .select('-featureText') // Don't send TF-IDF text to client
        .lean(),
      Media.countDocuments(query),
    ]);

    res.json({
      media,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── Search — must be before /:id to avoid conflict ────────────
router.get('/search', auth, async (req, res, next) => {
  try {
    const {
      q = '', page = 1, limit = 20,
      type, language, industry, genre,
      minRating, minYear, maxYear,
    } = req.query;

    const query = {};

    // Text search
    if (q.trim()) {
      query.$text = { $search: q.trim() };
    }

    // Filters
    if (type)     query.type = type;
    if (language) query.originalLanguage = language;
    if (industry) query.industry = industry;
    if (genre)    query.genres = { $in: [genre] };
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (minYear || maxYear) {
      query.releaseYear = {};
      if (minYear) query.releaseYear.$gte = Number(minYear);
      if (maxYear) query.releaseYear.$lte = Number(maxYear);
    }

    const skip = (Number(page) - 1) * Number(limit);

    // If text search, use text score for ranking; otherwise sort by popularity
    const sortCriteria = q.trim()
      ? { score: { $meta: 'textScore' }, popularity: -1 }
      : { popularity: -1 };

    const [media, total] = await Promise.all([
      Media.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(Number(limit))
        .select('-featureText')
        .lean(),
      Media.countDocuments(query),
    ]);

    res.json({ media, query: q, pagination: { page: Number(page), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    next(error);
  }
});

// ── Single Media Details ──────────────────────────────────────
router.get('/:id', auth, async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id).select('-featureText').lean();

    if (!media) {
      return res.status(404).json({ message: 'Media not found.' });
    }

    res.json({ media });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
