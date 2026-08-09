/**
 * Reference Routes — /api/genres, /api/languages, /api/industries
 *
 * Static data endpoints used by frontend dropdowns and filters.
 * Also returns unique values from the actual media collection
 * so they stay in sync with ingested data.
 */

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Media   = require('../models/Media');

// Language-industry config (server-side copy)
const LANGUAGES = [
  { code: 'kn', label: 'Kannada', industry: 'Sandalwood', region: 'Indian' },
  { code: 'te', label: 'Telugu', industry: 'Tollywood', region: 'Indian' },
  { code: 'ta', label: 'Tamil', industry: 'Kollywood', region: 'Indian' },
  { code: 'ml', label: 'Malayalam', industry: 'Mollywood', region: 'Indian' },
  { code: 'hi', label: 'Hindi', industry: 'Bollywood', region: 'Indian' },
  { code: 'bn', label: 'Bengali', industry: 'Bengali Cinema', region: 'Indian' },
  { code: 'mr', label: 'Marathi', industry: 'Marathi Cinema', region: 'Indian' },
  { code: 'pa', label: 'Punjabi', industry: 'Punjabi Cinema', region: 'Indian' },
  { code: 'en', label: 'English', industry: 'Hollywood', region: 'International' },
  { code: 'ko', label: 'Korean', industry: 'Korean Cinema', region: 'International' },
  { code: 'ja', label: 'Japanese', industry: 'Japanese Cinema', region: 'International' },
  { code: 'zh', label: 'Chinese', industry: 'Chinese Cinema', region: 'International' },
  { code: 'es', label: 'Spanish', industry: 'Spanish Cinema', region: 'International' },
  { code: 'fr', label: 'French', industry: 'French Cinema', region: 'International' },
];

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western',
];

// GET /api/genres
router.get('/genres', auth, async (req, res) => {
  try {
    // Return genres that actually exist in the database
    const dbGenres = await Media.distinct('genres');
    const validGenres = GENRES.filter(g => dbGenres.includes(g));
    res.json({ genres: validGenres.length > 0 ? validGenres : GENRES });
  } catch {
    res.json({ genres: GENRES });
  }
});

// GET /api/languages
router.get('/languages', (req, res) => {
  res.json({ languages: LANGUAGES });
});

// GET /api/industries
router.get('/industries', (req, res) => {
  const industries = [...new Set(LANGUAGES.map(l => l.industry))];
  res.json({ industries });
});

module.exports = router;
