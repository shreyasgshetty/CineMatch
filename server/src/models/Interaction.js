/**
 * Interaction Model
 *
 * Records every user action on a media item.
 * This collection becomes training data for collaborative filtering (Phase 15).
 *
 * Action types:
 * - 'watched':       User marked as watched (before rating)
 * - 'rated':         User gave a star rating (1-5)
 * - 'interested':    User said "Yes, I want to watch this"
 * - 'not_interested': User said "No, not interested"
 * - 'skipped':       User skipped the media during onboarding
 *
 * Why store all interactions and not just ratings?
 * "Interested" and "not_interested" are implicit feedback signals —
 * they're actually more valuable than ratings because users rate
 * far less often than they browse.
 */

const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
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
  action: {
    type: String,
    enum: ['watched', 'rated', 'interested', 'not_interested', 'skipped'],
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,  // Only set when action === 'rated'
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  // No timestamps: we use `timestamp` manually for query flexibility
});

// ── Indexes ─────────────────────────────────────────────────────
InteractionSchema.index({ userId: 1 });                  // User's history
InteractionSchema.index({ mediaId: 1 });                 // Media's interactions
InteractionSchema.index({ userId: 1, mediaId: 1 });      // Check if user interacted with media
InteractionSchema.index({ userId: 1, timestamp: -1 });   // Recent interactions
InteractionSchema.index({ action: 1, timestamp: -1 });   // Filter by action type

module.exports = mongoose.model('Interaction', InteractionSchema);
