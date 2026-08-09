/**
 * Recommendation Model
 *
 * Stores every recommendation shown to a user.
 * This allows us to:
 * 1. Track recommendation performance (Precision@K, Recall@K)
 * 2. Avoid showing the same item twice in a session
 * 3. Audit why recommendations were made (debugging)
 * 4. Build a recommendation history view for the user
 *
 * The `interaction` field is populated when the user gives feedback.
 */

const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: true,
  },
  score: {
    type: Number,     // Final recommendation score (0-1)
    required: true,
    min: 0,
    max: 1,
  },
  scoreBreakdown: {
    // Stores individual component scores for debugging/explanations
    contentSimilarity: { type: Number, default: 0 },
    languageMatch:     { type: Number, default: 0 },
    genreMatch:        { type: Number, default: 0 },
    actorMatch:        { type: Number, default: 0 },
    directorMatch:     { type: Number, default: 0 },
    popularityScore:   { type: Number, default: 0 },
    ratingScore:       { type: Number, default: 0 },
  },
  reasons: {
    type: [String],   // Human-readable explanations
    default: [],
    // e.g., ["Because you liked Kantara", "Matches your Action preference"]
  },
  shownAt: {
    type: Date,
    default: Date.now,
  },
  // Populated after user gives feedback
  interaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interaction',
    default: null,
  },
}, {
  timestamps: false, // We use `shownAt` explicitly
});

// ── Indexes ─────────────────────────────────────────────────────
RecommendationSchema.index({ userId: 1, shownAt: -1 });   // Recent recs
RecommendationSchema.index({ userId: 1, mediaId: 1 });    // Dedup check

module.exports = mongoose.model('Recommendation', RecommendationSchema);
