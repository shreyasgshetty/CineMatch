/**
 * Media Routes — /api/media
 *
 * GET /api/media               → List media (paginated, filterable)
 * GET /api/media/search        → Full-text + filter search
 * GET /api/media/people        → Search actors/directors (TMDB API + local fallback)
 * GET /api/media/:id           → Single media details
 *
 * TMDB API key stays on the backend — the frontend never touches TMDB directly.
 */

const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const optionalAuth = auth.optionalAuth;
const Media    = require('../models/Media');
const https    = require('https');

// ── TMDB fetch helper (no extra deps needed — uses built-in https) ────────────
const TMDB_BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_KEY  = process.env.TMDB_API_KEY;

function tmdbGet(path, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${TMDB_BASE}${path}`);
    url.searchParams.set('api_key', TMDB_KEY);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    https.get(url.toString(), { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('TMDB timeout')));
  });
}

// ── List Media ────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
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

// ── People Search ─────────────────────────────────────────────
// Primary source: TMDB /search/person API (full ~1M person database)
// Fallback:       Local MongoDB aggregation over ingested cast/directors
// Must be before /:id to avoid route conflict
router.get('/people', auth, async (req, res, next) => {
  try {
    const { q = '', limit = 10, role } = req.query;

    if (!q.trim()) {
      return res.json({ people: [] });
    }

    // ── Primary: TMDB person search ────────────────────────────
    if (TMDB_KEY) {
      try {
        const data = await tmdbGet('/search/person', { query: q.trim(), page: 1 });

        const knownForDeptFilter = role === 'director'
          ? 'Directing'
          : role === 'actor'
            ? 'Acting'
            : null; // null = all

        let results = (data.results || [])
          .filter(p => !knownForDeptFilter || p.known_for_department === knownForDeptFilter)
          .slice(0, Number(limit))
          .map(p => ({
            tmdbId: p.id,
            name: p.name,
            profilePath: p.profile_path || '',
            role: p.known_for_department === 'Directing' ? 'director' : 'actor',
            popularity: p.popularity,
            knownFor: (p.known_for || [])
              .slice(0, 3)
              .map(m => m.title || m.name)
              .filter(Boolean)
              .join(', '),
          }));

        // Sort: prioritise people whose movies we've ingested (they'll have richer data)
        const ingestedIds = await Media.distinct('cast.tmdbId', { 'cast.tmdbId': { $in: results.map(r => r.tmdbId) } });
        const ingestedSet = new Set(ingestedIds);
        results.sort((a, b) => {
          const aLocal = ingestedSet.has(a.tmdbId) ? 1 : 0;
          const bLocal = ingestedSet.has(b.tmdbId) ? 1 : 0;
          return bLocal - aLocal || b.popularity - a.popularity;
        });

        return res.json({ people: results, source: 'tmdb' });
      } catch (tmdbErr) {
        // TMDB unavailable — fall through to local DB search
        console.warn('TMDB people search failed, using local fallback:', tmdbErr.message);
      }
    }

    // ── Fallback: Local MongoDB aggregation ────────────────────
    const searchRegex = new RegExp(q.trim(), 'i');

    const castPipeline = [
      { $match: { 'cast.name': searchRegex } },
      { $unwind: '$cast' },
      { $match: { 'cast.name': searchRegex } },
      { $group: {
          _id: '$cast.tmdbId',
          name: { $first: '$cast.name' },
          profilePath: { $first: '$cast.profilePath' },
          titles: { $push: '$title' },
          maxPop: { $max: '$popularity' },
      }},
      { $sort: { maxPop: -1 } },
      { $limit: Number(limit) },
      { $project: { tmdbId: '$_id', name: 1, profilePath: 1, role: { $literal: 'actor' },
          knownFor: { $reduce: { input: { $slice: ['$titles', 3] }, initialValue: '',
            in: { $cond: [{ $eq: ['$$value', ''] }, '$$this', { $concat: ['$$value', ', ', '$$this'] }] } } } } },
    ];

    const directorPipeline = [
      { $match: { 'directors.name': searchRegex } },
      { $unwind: '$directors' },
      { $match: { 'directors.name': searchRegex } },
      { $group: {
          _id: '$directors.tmdbId',
          name: { $first: '$directors.name' },
          profilePath: { $first: '$directors.profilePath' },
          titles: { $push: '$title' },
          maxPop: { $max: '$popularity' },
      }},
      { $sort: { maxPop: -1 } },
      { $limit: Number(limit) },
      { $project: { tmdbId: '$_id', name: 1, profilePath: 1, role: { $literal: 'director' },
          knownFor: { $reduce: { input: { $slice: ['$titles', 3] }, initialValue: '',
            in: { $cond: [{ $eq: ['$$value', ''] }, '$$this', { $concat: ['$$value', ', ', '$$this'] }] } } } } },
    ];

    let people = [];
    if (role === 'director') {
      people = await Media.aggregate(directorPipeline);
    } else if (role === 'actor') {
      people = await Media.aggregate(castPipeline);
    } else {
      const [actors, directors] = await Promise.all([Media.aggregate(castPipeline), Media.aggregate(directorPipeline)]);
      const seen = new Set();
      for (const d of directors) { seen.add(d.tmdbId); people.push(d); }
      for (const a of actors)    { if (!seen.has(a.tmdbId)) people.push(a); }
      people = people.slice(0, Number(limit));
    }

    res.json({ people, source: 'local' });
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
