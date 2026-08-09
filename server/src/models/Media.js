/**
 * Media Model
 *
 * Single collection for both movies and TV shows.
 * Data is ingested from TMDB API via the data ingestion script.
 *
 * Key design decisions:
 * - `industry` is derived from `originalLanguage` using config mapping
 * - `featureText` is precomputed during ingestion for TF-IDF vectorization
 *   (title + genres + keywords + cast names + director names + overview)
 * - Cast is stored as an array (top 10 cast members max)
 * - Indexes on frequently queried fields for search performance
 *
 * DSA: Compound indexes on (type, originalLanguage, popularity) allow
 * MongoDB to use index intersection — like a sorted HashSet for filtering.
 */

const mongoose = require('mongoose');

// ── Cast Member Sub-Schema ─────────────────────────────────────
const CastSchema = new mongoose.Schema({
  tmdbId:    { type: Number, required: true },
  name:      { type: String, required: true },
  character: { type: String, default: '' },
}, { _id: false });

// ── Director Sub-Schema ────────────────────────────────────────
const DirectorSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true },
  name:   { type: String, required: true },
}, { _id: false });

// ── Media Schema ───────────────────────────────────────────────
const MediaSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['movie', 'tv'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  originalLanguage: {
    type: String,
    required: true,
    lowercase: true,
    // e.g., 'kn', 'en', 'hi'
  },
  originCountries: {
    type: [String],
    default: [],
    // e.g., ['IN', 'US']
  },
  industry: {
    type: String,
    required: true,
    // e.g., 'Sandalwood', 'Hollywood', 'Bollywood'
    // Derived from originalLanguage using LANGUAGE_TO_INDUSTRY config
  },
  genres: {
    type: [String],
    default: [],
    // e.g., ['Action', 'Thriller']
  },
  overview: {
    type: String,
    default: '',
  },
  releaseDate: {
    type: String,
    default: '',
  },
  releaseYear: {
    type: Number,
    default: null,
  },
  runtime: {
    type: Number,  // in minutes; null for TV shows at series level
    default: null,
  },
  rating: {
    type: Number,  // TMDB vote average (0-10)
    default: 0,
  },
  voteCount: {
    type: Number,
    default: 0,
  },
  popularity: {
    type: Number,  // TMDB popularity score
    default: 0,
  },
  cast: {
    type: [CastSchema],
    default: [],
  },
  directors: {
    type: [DirectorSchema],
    default: [],
  },
  keywords: {
    type: [String],  // TMDB keywords (normalized)
    default: [],
  },
  posterPath: {
    type: String,
    default: '',
    // Relative path — prepend https://image.tmdb.org/t/p/w500
  },
  backdropPath: {
    type: String,
    default: '',
    // Relative path — prepend https://image.tmdb.org/t/p/original
  },
  // Precomputed text for TF-IDF vectorization
  // Format: "title genres keywords cast_names director_names overview"
  featureText: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// ── Indexes ────────────────────────────────────────────────────
// These match the query patterns in the recommendation and search system
MediaSchema.index({ tmdbId: 1 });                          // Unique lookup
MediaSchema.index({ type: 1 });                            // Filter by movie/tv
MediaSchema.index({ originalLanguage: 1 });                // Filter by language
MediaSchema.index({ industry: 1 });                        // Filter by industry
MediaSchema.index({ genres: 1 });                          // Filter by genre
MediaSchema.index({ popularity: -1 });                     // Sort by popularity
MediaSchema.index({ rating: -1 });                         // Sort by rating
MediaSchema.index({ type: 1, originalLanguage: 1, popularity: -1 }); // Compound
MediaSchema.index({ title: 'text', overview: 'text' });    // Full-text search

// ── Virtual: TMDB Image URLs ───────────────────────────────────
MediaSchema.virtual('posterUrl').get(function() {
  return this.posterPath
    ? `https://image.tmdb.org/t/p/w500${this.posterPath}`
    : null;
});

MediaSchema.virtual('backdropUrl').get(function() {
  return this.backdropPath
    ? `https://image.tmdb.org/t/p/original${this.backdropPath}`
    : null;
});

MediaSchema.set('toJSON', { virtuals: true });
MediaSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Media', MediaSchema);
