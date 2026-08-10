/**
 * TMDB Data Ingestion Script
 * ============================================================
 * Usage (from repo root):  node scripts/ingest.js
 * Usage (dry run):         node scripts/ingest.js --dry-run
 *
 * All dependencies are resolved from server/node_modules automatically.
 * No need to install anything at the root level.
 * ============================================================
 */

// ── Bootstrap: add server/node_modules to module resolution ──
// This lets the script require dotenv/mongoose/node-fetch from
// server/node_modules regardless of what CWD you run it from.
const path = require('path');
const serverModules = path.join(__dirname, '../server/node_modules');
process.env.NODE_PATH = (process.env.NODE_PATH || '') + path.delimiter + serverModules;
require('module').Module._initPaths();
// ─────────────────────────────────────────────────────────────

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const fetch    = require('node-fetch');

// ── Config ────────────────────────────────────────────────────
const TMDB_BASE      = 'https://api.themoviedb.org/3';
const TMDB_KEY       = process.env.TMDB_API_KEY;
const MONGO_URI      = process.env.MONGODB_URI;
const DRY_RUN        = process.argv.includes('--dry-run');
const PAGES_PER_LANG = 5; // 5 pages × 20 results = 100 items per language
const DELAY_MS       = 260; // ~3.8 req/s — well under TMDB's 40/10s limit

// Language → industry mapping
const LANGUAGE_TO_INDUSTRY = {
  kn: 'Sandalwood', te: 'Tollywood',  ta: 'Kollywood',
  ml: 'Mollywood',  hi: 'Bollywood',  bn: 'Bengali Cinema',
  mr: 'Marathi Cinema', pa: 'Punjabi Cinema',
  en: 'Hollywood',  ko: 'Korean Cinema', ja: 'Japanese Cinema',
  zh: 'Chinese Cinema', es: 'Spanish Cinema', fr: 'French Cinema',
};

// Languages to ingest — add/remove as needed
const INGEST_LANGUAGES = ['kn', 'te', 'ta', 'ml', 'hi', 'en', 'ko'];

// TMDB genre ID → name map
const TMDB_GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

// ── Helpers ───────────────────────────────────────────────────
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const tmdbFetch = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB API error: ${res.status} for ${path}`);
  return res.json();
};

/**
 * Build featureText for TF-IDF
 * This is the "document" that represents a media item for NLP.
 *
 * Why this format?
 * TF-IDF gives higher weight to terms that appear often in this document
 * but rarely across all documents. So a unique actor name or specific keyword
 * will carry more signal than common words like "drama".
 */
const buildFeatureText = (media) => {
  const parts = [
    media.title,
    media.title,           // Repeat title to give it more weight
    media.genres.join(' '),
    media.genres.join(' '), // Repeat genres
    media.keywords.join(' '),
    media.cast.slice(0, 8).map(a => a.name).join(' '),
    media.directors.map(d => d.name).join(' '),
    media.directors.map(d => d.name).join(' '), // Directors get extra weight
    media.industry,
    media.originalLanguage,
    media.overview.slice(0, 500), // Trim overview to avoid noise
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
};

/**
 * Normalize a TMDB movie/TV item into our Media schema.
 */
const normalizeMedia = (item, type, credits, keywords) => {
  const genres = (item.genre_ids || item.genres?.map(g => g.id) || [])
    .map(id => TMDB_GENRE_MAP[id])
    .filter(Boolean);

  const cast = (credits?.cast || [])
    .slice(0, 10)
    .map(c => ({ tmdbId: c.id, name: c.name, character: c.character || '', profilePath: c.profile_path || '' }));

  const directors = (credits?.crew || [])
    .filter(c => c.job === 'Director')
    .map(d => ({ tmdbId: d.id, name: d.name, profilePath: d.profile_path || '' }));

  const rawKeywords = keywords?.keywords || keywords?.results || [];
  const kwList = rawKeywords.map(k => k.name).filter(Boolean);

  const originalLanguage = item.original_language || 'en';
  const originCountries = item.origin_country ||
    (item.production_countries?.map(c => c.iso_3166_1) || []);

  const releaseDate = type === 'movie'
    ? (item.release_date || '')
    : (item.first_air_date || '');

  const releaseYear = releaseDate ? parseInt(releaseDate.slice(0, 4)) : null;

  const media = {
    tmdbId: item.id,
    type,
    title: type === 'movie' ? item.title : item.name,
    originalLanguage,
    originCountries,
    industry: LANGUAGE_TO_INDUSTRY[originalLanguage] || 'Other',
    genres,
    overview: item.overview || '',
    releaseDate,
    releaseYear,
    runtime: item.runtime || null,
    rating: item.vote_average || 0,
    voteCount: item.vote_count || 0,
    popularity: item.popularity || 0,
    cast,
    directors,
    keywords: kwList,
    posterPath: item.poster_path || '',
    backdropPath: item.backdrop_path || '',
  };

  media.featureText = buildFeatureText(media);
  return media;
};

// ── Main Ingestion Function ───────────────────────────────────
const ingest = async () => {
  console.log('\n🎬 CineMatch — TMDB Data Ingestion Script');
  console.log('==========================================');

  if (!TMDB_KEY) {
    console.error('❌ TMDB_API_KEY not set in .env');
    process.exit(1);
  }

  // Load Media model using absolute path (works from any CWD)
  const MediaModel = require(path.join(__dirname, '../server/src/models/Media'));

  if (!DRY_RUN) {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
  }

  let totalIngested = 0;
  let totalErrors   = 0;

  for (const lang of INGEST_LANGUAGES) {
    console.log(`\n📽️  Ingesting ${lang.toUpperCase()} content…`);

    for (const type of ['movie', 'tv']) {
      const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';

      for (let page = 1; page <= PAGES_PER_LANG; page++) {
        try {
          const data = await tmdbFetch(endpoint, {
            with_original_language: lang,
            sort_by: 'popularity.desc',
            page,
            'vote_count.gte': 10,
          });

          console.log(`  [${lang}/${type}] Page ${page}: ${data.results?.length || 0} results`);

          for (const item of (data.results || [])) {
            await delay(DELAY_MS);

            try {
              // Fetch full details + credits + keywords
              const [details, credits, keywords] = await Promise.all([
                tmdbFetch(`/${type}/${item.id}`),
                tmdbFetch(`/${type}/${item.id}/credits`),
                tmdbFetch(`/${type}/${item.id}/keywords`),
              ]);

              const normalized = normalizeMedia(details, type, credits, keywords);

              if (DRY_RUN) {
                console.log(`    [DRY RUN] Would save: ${normalized.title} (${normalized.releaseYear})`);
              } else {
                await MediaModel.findOneAndUpdate(
                  { tmdbId: normalized.tmdbId },
                  normalized,
                  { upsert: true, new: true, runValidators: false }
                );
                totalIngested++;
              }

              await delay(DELAY_MS * 2); // Extra delay after detail fetch

            } catch (itemErr) {
              console.warn(`    ⚠️  Failed to process item ${item.id}: ${itemErr.message}`);
              totalErrors++;
            }
          }

          await delay(500); // Pause between pages
        } catch (pageErr) {
          console.error(`  ❌ Error on page ${page}: ${pageErr.message}`);
          totalErrors++;
        }
      }
    }
  }

  console.log('\n==========================================');
  console.log(`✅ Ingestion complete!`);
  console.log(`   Total ingested: ${totalIngested}`);
  console.log(`   Errors: ${totalErrors}`);

  if (!DRY_RUN) {
    await mongoose.disconnect();
  }
};

// Run
ingest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
