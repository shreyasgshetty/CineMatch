/**
 * CineMatch — Database Diagnostic Script
 * Usage: node scripts/check-db.js
 *
 * Shows:
 *  - Total media count
 *  - Per-language breakdown (movies + TV)
 *  - Poster coverage (% of docs with a posterPath)
 *  - How many have at least 1 poster (for collage)
 */

const path = require('path');
const serverModules = path.join(__dirname, '../server/node_modules');
process.env.NODE_PATH = (process.env.NODE_PATH || '') + path.delimiter + serverModules;
require('module').Module._initPaths();

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');

const LANGUAGE_LABELS = {
  kn: 'Kannada (Sandalwood)',
  te: 'Telugu (Tollywood)',
  ta: 'Tamil (Kollywood)',
  ml: 'Malayalam (Mollywood)',
  hi: 'Hindi (Bollywood)',
  bn: 'Bengali Cinema',
  mr: 'Marathi Cinema',
  pa: 'Punjabi Cinema',
  en: 'English (Hollywood)',
  ko: 'Korean Cinema',
  ja: 'Japanese Cinema',
  zh: 'Chinese Cinema',
  es: 'Spanish Cinema',
  fr: 'French Cinema',
};

const ALL_LANGS = Object.keys(LANGUAGE_LABELS);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Media = require(path.join(__dirname, '../server/src/models/Media'));

  console.log('\n============================================================');
  console.log('  CineMatch — Database Diagnostic Report');
  console.log('============================================================\n');

  // Total count
  const total = await Media.countDocuments();
  const totalMovies = await Media.countDocuments({ type: 'movie' });
  const totalTV = await Media.countDocuments({ type: 'tv' });
  const withPoster = await Media.countDocuments({ posterPath: { $ne: '' } });

  console.log(`TOTAL DOCUMENTS : ${total.toLocaleString()}`);
  console.log(`  Movies        : ${totalMovies.toLocaleString()}`);
  console.log(`  TV Shows      : ${totalTV.toLocaleString()}`);
  console.log(`  With poster   : ${withPoster.toLocaleString()} (${Math.round(withPoster/total*100)}%)`);
  console.log('');

  // Per-language breakdown
  console.log('PER-LANGUAGE BREAKDOWN:');
  console.log('─'.repeat(62));
  console.log(
    'Lang'.padEnd(6) +
    'Label'.padEnd(30) +
    'Movies'.padStart(8) +
    'TV'.padStart(8) +
    'Total'.padStart(8) +
    'Posters'.padStart(10)
  );
  console.log('─'.repeat(62));

  let missingLangs = [];

  for (const lang of ALL_LANGS) {
    const movies = await Media.countDocuments({ originalLanguage: lang, type: 'movie' });
    const tv     = await Media.countDocuments({ originalLanguage: lang, type: 'tv' });
    const tot    = movies + tv;
    const posters = await Media.countDocuments({ originalLanguage: lang, posterPath: { $ne: '' } });
    const pct    = tot > 0 ? Math.round(posters / tot * 100) : 0;
    const label  = LANGUAGE_LABELS[lang] || lang;

    const status = tot === 0 ? ' !! EMPTY !!' : posters < 4 ? ' !! <4 posters !!' : '';

    console.log(
      lang.padEnd(6) +
      label.padEnd(30) +
      String(movies).padStart(8) +
      String(tv).padStart(8) +
      String(tot).padStart(8) +
      `${String(posters)} (${pct}%)`.padStart(10) +
      status
    );

    if (tot === 0) missingLangs.push(lang);
  }

  console.log('─'.repeat(62));

  // Collage check — need >=4 posters per language for a good collage
  console.log('\nCOLLAGE READINESS (need >= 4 poster docs per language):');
  console.log('─'.repeat(62));
  for (const lang of ALL_LANGS) {
    const posters = await Media.countDocuments({ originalLanguage: lang, posterPath: { $ne: '' } });
    const symbol = posters >= 4 ? '  OK' : posters > 0 ? ' PARTIAL' : '  MISSING';
    console.log(`  ${lang.padEnd(4)} ${LANGUAGE_LABELS[lang].padEnd(32)} ${String(posters).padStart(5)} posters  ${symbol}`);
  }

  // Show sample titles for languages with low counts
  if (missingLangs.length > 0) {
    console.log(`\nLANGUAGES WITH ZERO DOCS: ${missingLangs.join(', ')}`);
    console.log('These are NOT ingested in ingest.js INGEST_LANGUAGES array.');
    console.log('Current INGEST_LANGUAGES: kn, te, ta, ml, hi, bn, mr, pa, en, ko, ja');
    console.log('MISSING from ingest: zh (Chinese), es (Spanish), fr (French)');
  }

  // Sample titles from pa, bn, mr to check quality
  console.log('\nSAMPLE TITLES — SMALLER LANGUAGES:');
  for (const lang of ['pa', 'bn', 'mr', 'zh', 'es', 'fr']) {
    const samples = await Media.find(
      { originalLanguage: lang, posterPath: { $ne: '' } },
      { title: 1, releaseYear: 1, rating: 1, type: 1 }
    ).sort({ popularity: -1 }).limit(3);

    if (samples.length > 0) {
      console.log(`\n  ${lang.toUpperCase()} (${LANGUAGE_LABELS[lang]}):`);
      samples.forEach(m => {
        console.log(`    - ${m.title} (${m.releaseYear}, ${m.type}, rating: ${m.rating?.toFixed(1)})`);
      });
    } else {
      console.log(`\n  ${lang.toUpperCase()} (${LANGUAGE_LABELS[lang]}): NO DOCUMENTS`);
    }
  }

  await mongoose.disconnect();
  console.log('\n============================================================\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
