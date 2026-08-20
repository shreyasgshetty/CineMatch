/**
 * WatchSchedule Model
 *
 * Stores user-defined cinema scheduling entries.
 * One entry = one scheduled viewing of a media item.
 *
 * This is intentionally separate from the Interaction model:
 * - Interaction = implicit/explicit feedback for recommendation learning
 * - WatchSchedule = user-driven planning data for the Watch Planner feature
 *
 * Status lifecycle:
 *   scheduled → watched   (user marks as watched)
 *   scheduled → cancelled (user removes from planner)
 *
 * Conflict detection is handled at the route level using scheduledAt + duration.
 */

const mongoose = require('mongoose');

const WatchScheduleSchema = new mongoose.Schema({
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
  scheduledAt: {
    type: Date,
    required: true,
  },
  // Snapshot of media.runtime at scheduling time (minutes)
  // Stored so end-time calculation works even if media data changes
  duration: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: ['scheduled', 'watched', 'cancelled'],
    default: 'scheduled',
  },
}, {
  timestamps: true,
});

// ── Indexes ──────────────────────────────────────────────────
WatchScheduleSchema.index({ userId: 1, status: 1 });            // List active schedule
WatchScheduleSchema.index({ userId: 1, scheduledAt: 1 });       // Chronological order
WatchScheduleSchema.index({ userId: 1, mediaId: 1, status: 1 }); // Duplicate active check

module.exports = mongoose.model('WatchSchedule', WatchScheduleSchema);
