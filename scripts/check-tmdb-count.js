/**
 * Quick probe: how many results does TMDB actually have for a language?
 * Usage: node scripts/check-tmdb-count.js kn
 */
const path = require('path');
const serverModules = path.join(__dirname, '../server/node_modules');
process.env.NODE_PATH = (process.env.NODE_PATH || '') + path.delimiter + serverModules;
require('module').Module._initPaths();

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const fetch = require('node-fetch');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY  = process.env.TMDB_API_KEY;
const lang      = process.argv[2] || 'kn';

async function probe(type, sort, minVotes) {
  const url = new URL(`${TMDB_BASE}/discover/${type}`);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('with_original_language', lang);
  url.searchParams.set('sort_by', sort);
  url.searchParams.set('vote_count.gte', minVotes);
  url.searchParams.set('page', 1);
  const res = await fetch(url.toString());
  const data = await res.json();
  return { total_results: data.total_results, total_pages: data.total_pages };
}

(async () => {
  console.log(`\nTMDB availability probe for language: [${lang.toUpperCase()}]\n`);
  console.log('Type   Sort                minVotes   Total Results   Total Pages');
  console.log('─'.repeat(70));

  for (const type of ['movie', 'tv']) {
    for (const sort of ['popularity.desc', 'vote_count.desc']) {
      for (const mv of [0, 1, 3, 5, 10]) {
        const r = await probe(type, sort, mv);
        console.log(
          `${type.padEnd(6)} ${sort.padEnd(20)} ${String(mv).padEnd(10)} ${String(r.total_results ?? '?').padEnd(16)} ${r.total_pages ?? '?'}`
        );
      }
    }
  }

  console.log('\nDone. TMDB caps at 500 pages × 20 = 10,000 results per sort strategy.');
  console.log('Unique items after dedup across sorts will be fewer.\n');
})().catch(e => { console.error(e.message); process.exit(1); });
