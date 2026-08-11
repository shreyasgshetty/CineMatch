/**
 * CineMatch — Bulk TMDB Ingestion Script
 * ============================================================
 * Usage:
 *   node scripts/ingest-bulk.js                  → all languages, all strategies
 *   node scripts/ingest-bulk.js --only=kn,ta,te  → specific languages
 *   node scripts/ingest-bulk.js --skip-existing  → skip IDs already in DB (faster)
 *   node scripts/ingest-bulk.js --dry-run        → count without saving
 *
 * Strategy:
 *   Each language is ingested using MULTIPLE sort orders to maximize
 *   unique content discovered. TMDB returns max 500 pages × 20 = 10,000
 *   items per sort strategy.
 *
 *   Per-language page limits (each applied per sort strategy):
 *     Major (en, hi, ko):         50 pages × 3 sorts = up to 3,000 items
 *     Mid (te, ta, ml, ja):       40 pages × 2 sorts = up to 1,600 items
 *     Regional (kn, bn, mr, pa):  30 pages × 2 sorts = up to 1,200 items
 *     Intl small (zh, es, fr):    40 pages × 2 sorts = up to 1,600 items
 * ============================================================
 */

const path = require('path');
const serverModules = path.join(__dirname, '../server/node_modules');
process.env.NODE_PATH = (process.env.NODE_PATH || '') + path.delimiter + serverModules;
require('module').Module._initPaths();

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const fetch    = require('node-fetch');

// ── Config ────────────────────────────────────────────────────
const TMDB_BASE   = 'https://api.themoviedb.org/3';
const TMDB_KEY    = process.env.TMDB_API_KEY;
const MONGO_URI   = process.env.MONGODB_URI;
const DRY_RUN     = process.argv.includes('--dry-run');
const SKIP_EXISTING = process.argv.includes('--skip-existing');
const DELAY_MS    = 270; // ms between requests

const ONLY_FLAG  = process.argv.find(a => a.startsWith('--only='));
const ONLY_LANGS = ONLY_FLAG ? ONLY_FLAG.replace('--only=', '').split(',') : null;

// ── Per-language configuration ────────────────────────────────
// pages: max pages per sort strategy (TMDB returns 20 per page)
// minVotes: minimum vote_count — lower = more regional/niche films
// sorts: TMDB sort_by strategies — order matters (best first)
const LANG_CONFIG = {
  // Major Indian
  kn: { pages: 30, minVotes: 3,  label: 'Kannada (Sandalwood)',  sorts: ['popularity.desc', 'vote_count.desc', 'vote_average.desc'] },
  te: { pages: 40, minVotes: 5,  label: 'Telugu (Tollywood)',    sorts: ['popularity.desc', 'vote_count.desc'] },
  ta: { pages: 40, minVotes: 5,  label: 'Tamil (Kollywood)',     sorts: ['popularity.desc', 'vote_count.desc'] },
  ml: { pages: 35, minVotes: 3,  label: 'Malayalam (Mollywood)', sorts: ['popularity.desc', 'vote_count.desc'] },
  hi: { pages: 50, minVotes: 5,  label: 'Hindi (Bollywood)',     sorts: ['popularity.desc', 'vote_count.desc', 'primary_release_date.desc'] },
  // Smaller Indian
  bn: { pages: 30, minVotes: 3,  label: 'Bengali Cinema',        sorts: ['popularity.desc', 'vote_count.desc'] },
  mr: { pages: 25, minVotes: 2,  label: 'Marathi Cinema',        sorts: ['popularity.desc', 'vote_count.desc'] },
  pa: { pages: 20, minVotes: 2,  label: 'Punjabi Cinema',        sorts: ['popularity.desc', 'vote_count.desc'] },
  // International
  en: { pages: 50, minVotes: 10, label: 'English (Hollywood)',   sorts: ['popularity.desc', 'vote_count.desc', 'vote_average.desc'] },
  ko: { pages: 45, minVotes: 5,  label: 'Korean Cinema',         sorts: ['popularity.desc', 'vote_count.desc', 'vote_average.desc'] },
  ja: { pages: 45, minVotes: 5,  label: 'Japanese Cinema',       sorts: ['popularity.desc', 'vote_count.desc'] },
  zh: { pages: 40, minVotes: 5,  label: 'Chinese Cinema',        sorts: ['popularity.desc', 'vote_count.desc'] },
  es: { pages: 40, minVotes: 5,  label: 'Spanish Cinema',        sorts: ['popularity.desc', 'vote_count.desc', 'vote_average.desc'] },
  fr: { pages: 40, minVotes: 5,  label: 'French Cinema',         sorts: ['popularity.desc', 'vote_count.desc', 'vote_average.desc'] },
};

const LANGUAGE_TO_INDUSTRY = {
  kn: 'Sandalwood', te: 'Tollywood',  ta: 'Kollywood',
  ml: 'Mollywood',  hi: 'Bollywood',  bn: 'Bengali Cinema',
  mr: 'Marathi Cinema', pa: 'Punjabi Cinema',
  en: 'Hollywood',  ko: 'Korean Cinema', ja: 'Japanese Cinema',
  zh: 'Chinese Cinema', es: 'Spanish Cinema', fr: 'French Cinema',
};

const TMDB_GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10765: 'Sci-Fi & Fantasy', 10768: 'War & Politics',
};

// ── Helpers ───────────────────────────────────────────────────
const delay = (ms) => new Promise(r => setTimeout(r, ms));
let totalIngested = 0, totalSkipped = 0, totalErrors = 0;

const tmdbFetch = async (urlPath, params = {}, retries = 5) => {
  const url = new URL(`${TMDB_BASE}${urlPath}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url.toString());
      if (res.status === 429) {
        const wait = parseInt(res.headers.get('retry-after') || '12', 10) * 1000 + 500;
        console.warn(`    [429] Rate limited — waiting ${Math.round(wait/1000)}s…`);
        await delay(wait);
        continue;
      }
      if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const retryable = ['ECONNRESET','ETIMEDOUT','ENOTFOUND','ECONNREFUSED'].includes(err.code) || err.message.includes('fetch');
      if (retryable && attempt < retries) {
        const wait = Math.min(1200 * Math.pow(2, attempt), 20000);
        process.stdout.write(`    [retry ${attempt+1}] ${err.code || 'network'} — wait ${Math.round(wait/1000)}s…\r`);
        await delay(wait);
        continue;
      }
      throw err;
    }
  }
};

const normalizeMedia = (item, type, credits, keywords) => {
  const genres = (item.genre_ids || item.genres?.map(g => g.id) || [])
    .map(id => TMDB_GENRE_MAP[id]).filter(Boolean);

  const cast = (credits?.cast || []).slice(0, 10).map(c => ({
    tmdbId: c.id, name: c.name,
    character: c.character || '', profilePath: c.profile_path || '',
  }));

  const directors = (credits?.crew || [])
    .filter(c => c.job === 'Director')
    .map(d => ({ tmdbId: d.id, name: d.name, profilePath: d.profile_path || '' }));

  const kwList = (keywords?.keywords || keywords?.results || []).map(k => k.name).filter(Boolean);

  const originalLanguage = item.original_language || 'en';
  const releaseDate = type === 'movie' ? (item.release_date || '') : (item.first_air_date || '');
  const releaseYear = releaseDate ? parseInt(releaseDate.slice(0, 4)) : null;

  const media = {
    tmdbId: item.id, type,
    title: type === 'movie' ? item.title : item.name,
    originalLanguage,
    originCountries: item.origin_country || (item.production_countries?.map(c => c.iso_3166_1) || []),
    industry: LANGUAGE_TO_INDUSTRY[originalLanguage] || 'Other',
    genres, overview: item.overview || '',
    releaseDate, releaseYear,
    runtime: item.runtime || null,
    rating: item.vote_average || 0,
    voteCount: item.vote_count || 0,
    popularity: item.popularity || 0,
    cast, directors, keywords: kwList,
    posterPath: item.poster_path || '',
    backdropPath: item.backdrop_path || '',
  };

  // Build featureText for TF-IDF
  media.featureText = [
    media.title, media.title,
    media.genres.join(' '), media.genres.join(' '),
    media.keywords.join(' '),
    media.cast.slice(0, 8).map(a => a.name).join(' '),
    media.directors.map(d => d.name).join(' '),
    media.directors.map(d => d.name).join(' '),
    media.industry, media.originalLanguage,
    media.overview.slice(0, 500),
  ].filter(Boolean).join(' ').toLowerCase();

  return media;
};

// ── Main ──────────────────────────────────────────────────────
const run = async () => {
  console.log('\n============================================================');
  console.log('  CineMatch — Bulk TMDB Ingestion');
  console.log('============================================================');

  if (!TMDB_KEY) { console.error('ERROR: TMDB_API_KEY not set'); process.exit(1); }

  let Media, existingIds = new Set();
  if (!DRY_RUN) {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    Media = require(path.join(__dirname, '../server/src/models/Media'));

    if (SKIP_EXISTING) {
      console.log('Loading existing TMDB IDs…');
      const ids = await Media.distinct('tmdbId');
      ids.forEach(id => existingIds.add(id));
      console.log(`  ${existingIds.size.toLocaleString()} existing IDs loaded (will skip)\n`);
    }
  }

  const targetLangs = ONLY_LANGS
    ? Object.keys(LANG_CONFIG).filter(l => ONLY_LANGS.includes(l))
    : Object.keys(LANG_CONFIG);

  console.log(`Languages to ingest: ${targetLangs.join(', ')}\n`);

  const startTime = Date.now();

  for (const lang of targetLangs) {
    const cfg = LANG_CONFIG[lang];
    const langStart = Date.now();
    let langCount = 0;

    console.log(`\n────────────────────────────────────────────────────────────`);
    console.log(`  ${cfg.label} [${lang}]  |  ${cfg.pages} pages × ${cfg.sorts.length} sorts  |  minVotes: ${cfg.minVotes}`);
    console.log(`────────────────────────────────────────────────────────────`);

    for (const type of ['movie', 'tv']) {
      const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';

      for (const sortBy of cfg.sorts) {
        let seenOnThisStrategy = 0;

        for (let page = 1; page <= cfg.pages; page++) {
          try {
            await delay(DELAY_MS);
            const data = await tmdbFetch(endpoint, {
              with_original_language: lang,
              sort_by: sortBy,
              page,
              'vote_count.gte': cfg.minVotes,
            });

            const results = data.results || [];
            if (results.length === 0) break; // No more results

            let pageNew = 0;
            for (const item of results) {
              // Skip if already in DB (when --skip-existing)
              if (SKIP_EXISTING && existingIds.has(item.id)) {
                totalSkipped++;
                continue;
              }

              await delay(DELAY_MS);

              try {
                const [details, credits, keywords] = await Promise.all([
                  tmdbFetch(`/${type}/${item.id}`),
                  tmdbFetch(`/${type}/${item.id}/credits`),
                  tmdbFetch(`/${type}/${item.id}/keywords`),
                ]);

                const normalized = normalizeMedia(details, type, credits, keywords);

                if (DRY_RUN) {
                  console.log(`  [DRY] ${normalized.title} (${normalized.releaseYear})`);
                } else {
                  await Media.findOneAndUpdate(
                    { tmdbId: normalized.tmdbId },
                    normalized,
                    { upsert: true, new: true, runValidators: false }
                  );
                  existingIds.add(normalized.tmdbId); // track across strategies
                  totalIngested++;
                  langCount++;
                  pageNew++;
                }

                await delay(DELAY_MS);

              } catch (itemErr) {
                totalErrors++;
                // Don't log per-item errors to keep output clean
              }
            }

            seenOnThisStrategy += results.length;

            // Progress line
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            process.stdout.write(
              `  [${lang}/${type}] ${sortBy.split('.')[0].padEnd(12)} p${String(page).padStart(3)}/${cfg.pages}  +${pageNew}  total:${totalIngested.toLocaleString()}  ${elapsed}s elapsed\r`
            );

            // If we're consistently getting 0 new items, break early
            if (pageNew === 0 && page > 3) break;

          } catch (pageErr) {
            totalErrors++;
            console.error(`\n  ERROR [${lang}/${type}] page ${page}: ${pageErr.message}`);
          }
        }
        console.log(`  [${lang}/${type}/${sortBy}] Done — ${seenOnThisStrategy} items scanned`);
      }
    }

    const elapsed = Math.round((Date.now() - langStart) / 1000);
    console.log(`  ${cfg.label}: +${langCount} saved  (${elapsed}s)`);
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(totalTime / 60), secs = totalTime % 60;

  console.log('\n============================================================');
  console.log('  Bulk Ingestion Complete');
  console.log('============================================================');
  console.log(`  Ingested : ${totalIngested.toLocaleString()}`);
  console.log(`  Skipped  : ${totalSkipped.toLocaleString()} (already existed)`);
  console.log(`  Errors   : ${totalErrors.toLocaleString()}`);
  console.log(`  Time     : ${mins}m ${secs}s`);
  console.log('\n  Run: node scripts/check-db.js  to verify counts\n');

  if (!DRY_RUN) await mongoose.disconnect();
};

run().catch(err => { console.error('\nFatal:', err.message); process.exit(1); });
