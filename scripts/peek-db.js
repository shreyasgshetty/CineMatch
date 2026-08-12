/**
 * Quick peek at what a stored document looks like in MongoDB
 * Usage: node scripts/peek-db.js
 */
const path = require('path');
const serverModules = path.join(__dirname, '../server/node_modules');
process.env.NODE_PATH = (process.env.NODE_PATH || '') + path.delimiter + serverModules;
require('module').Module._initPaths();

require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Media = require(path.join(__dirname, '../server/src/models/Media'));

  console.log('\n=== WHERE IS THE DATA? ===\n');
  console.log('Storage  : MongoDB Atlas (cloud)');
  console.log('Cluster  : cluster0.1hmjpna.mongodb.net');
  console.log('Database : (default)');
  console.log('Collection: media\n');

  const total = await Media.countDocuments();
  console.log(`Total documents in "media" collection: ${total.toLocaleString()}\n`);

  console.log('=== SAMPLE DOCUMENT (1 Kannada movie) ===\n');
  const sample = await Media.findOne({ originalLanguage: 'kn' }).lean();
  if (sample) {
    console.log({
      _id:              sample._id,
      tmdbId:           sample.tmdbId,
      type:             sample.type,
      title:            sample.title,
      originalLanguage: sample.originalLanguage,
      industry:         sample.industry,
      releaseYear:      sample.releaseYear,
      rating:           sample.rating,
      voteCount:        sample.voteCount,
      popularity:       sample.popularity,
      genres:           sample.genres,
      posterPath:       sample.posterPath,
      posterFullUrl:    `https://image.tmdb.org/t/p/w500${sample.posterPath}`,
      cast:             sample.cast?.slice(0,2),
      directors:        sample.directors,
      keywords:         sample.keywords?.slice(0,5),
    });
  }

  console.log('\n=== WHAT IS STORED vs FETCHED LIVE ===\n');
  console.log('Stored in MongoDB Atlas:');
  console.log('  title, genres, cast names, director names');
  console.log('  posterPath  (e.g. "/abc123.jpg")');
  console.log('  backdropPath, overview, releaseYear, rating');
  console.log('  featureText (for AI recommendations)');
  console.log('');
  console.log('Fetched live from TMDB CDN (never stored):');
  console.log('  Actual poster images → https://image.tmdb.org/t/p/w500<posterPath>');
  console.log('  Actual backdrop images');

  await mongoose.disconnect();
}

main().catch(e => console.error(e.message));
