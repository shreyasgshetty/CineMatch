/**
 * Interaction Routes — /api/interactions
 *
 * GET /api/interactions/:mediaId  → Fetch user's existing rating for a media item
 * POST /api/interactions          → Record user feedback (rate, watch, interest)
 *
 * --- Rating System ---
 * One rating per (userId, mediaId) pair, enforced via findOneAndUpdate with upsert.
 *
 * Aggregate maintenance rules:
 *   First rating:  cmRating = (oldAvg * oldCount + newRating) / (oldCount + 1)
 *                  cmVoteCount += 1
 *   Rating update: cmRating = (oldAvg * count - oldRating + newRating) / count
 *                  cmVoteCount unchanged — no double counting
 *
 * Preference learning:
 *   First rating: full signal applied
 *   Rating update: delta signal applied = signal(new) - signal(old)
 *
 * Non-rating actions (watched, interested, not_interested, skipped):
 *   Always create new documents — they represent distinct events.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Media = require('../models/Media');
const Interaction = require('../models/Interaction');
const Recommendation = require('../models/Recommendation');

const LEARNING_RATE = 0.08;

// ── Rating to signal conversion ───────────────────────────────
const ratingToSignal = (rating) => {
  if (rating >= 5) return 1.0;
  if (rating >= 4) return 0.5;
  if (rating >= 3) return 0.1;
  if (rating >= 2) return -0.3;
  return -0.7;
};

// ── Action to signal conversion ───────────────────────────────
const actionToSignal = (action, rating) => {
  if (action === 'rated' && rating) return ratingToSignal(rating);
  if (action === 'interested') return 0.4;
  if (action === 'not_interested') return -0.4;
  if (action === 'watched') return 0.1; // Weak positive signal
  return 0;
};

// ── Apply preference signal to user profile ───────────────────
async function applyPreferenceSignal(userId, media, signal) {
  if (signal === 0) return;
  const user = await User.findById(userId);
  if (!user) return;

  // Update genre weights
  for (const genre of media.genres) {
    const current = user.preferences.genres.get(genre) || 0;
    const updated = Math.max(-1, Math.min(1, current + LEARNING_RATE * signal));
    user.preferences.genres.set(genre, updated);
  }

  // Update actor weights (top 5 actors only)
  for (const actor of media.cast.slice(0, 5)) {
    const key = String(actor.tmdbId);
    const current = user.preferences.actors.get(key) || 0;
    const updated = Math.max(-1, Math.min(1, current + LEARNING_RATE * signal * 0.8));
    user.preferences.actors.set(key, updated);
  }

  // Update director weights
  for (const director of media.directors) {
    const key = String(director.tmdbId);
    const current = user.preferences.directors.get(key) || 0;
    const updated = Math.max(-1, Math.min(1, current + LEARNING_RATE * signal * 1.2));
    user.preferences.directors.set(key, updated);
  }

  await user.save();
}

// ── GET /api/interactions/:mediaId ────────────────────────────
router.get('/:mediaId', auth, async (req, res, next) => {
  try {
    const interaction = await Interaction.findOne({
      userId: req.user.userId,
      mediaId: req.params.mediaId,
      action: 'rated',
    })
      .sort({ timestamp: -1 })
      .select('action rating timestamp');

    res.json({
      interaction: interaction || null,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/interactions ────────────────────────────────────
router.post('/', auth, async (req, res, next) => {
  try {
    const { mediaId, action, rating, recommendationId } = req.body;

    // Validate action
    const validActions = ['watched', 'rated', 'interested', 'not_interested', 'skipped'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: `Invalid action. Must be one of: ${validActions.join(', ')}` });
    }

    // Validate rating
    if (action === 'rated' && (!rating || rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    // Find media
    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ message: 'Media not found.' });

    let interaction;
    let signal = 0;
    let updatedCmRating = media.cmRating || 0;
    let updatedCmVoteCount = media.cmVoteCount || 0;

    // ── Rating: Upsert logic ──────────────────────────────────
    if (action === 'rated') {
      // Check for existing rating from this user
      const existing = await Interaction.findOne({
        userId: req.user.userId,
        mediaId,
        action: 'rated',
      });

      if (existing) {
        // ── Rating UPDATE ─────────────────────────────────────
        const oldRating = existing.rating;
        const newRating = rating;

        // Update the interaction document in-place
        existing.rating = newRating;
        existing.timestamp = new Date();
        await existing.save();
        interaction = existing;

        // Recalculate aggregate without changing vote count
        const count = media.cmVoteCount || 1;
        const newAvg = ((media.cmRating || 0) * count - oldRating + newRating) / count;
        updatedCmRating = Math.max(0, Math.min(5, Math.round(newAvg * 10) / 10));
        updatedCmVoteCount = count;

        await Media.findByIdAndUpdate(mediaId, {
          cmRating: updatedCmRating,
          cmVoteCount: updatedCmVoteCount,
        });

        // Delta signal for preference learning
        signal = ratingToSignal(newRating) - ratingToSignal(oldRating);
      } else {
        // ── First RATING ──────────────────────────────────────
        interaction = await Interaction.create({
          userId: req.user.userId,
          mediaId,
          action: 'rated',
          rating,
          timestamp: new Date(),
        });

        // Weighted incremental average
        const oldCount = media.cmVoteCount || 0;
        const oldAvg = media.cmRating || 0;
        const newCount = oldCount + 1;
        const newAvg = (oldAvg * oldCount + rating) / newCount;
        updatedCmRating = Math.max(0, Math.min(5, Math.round(newAvg * 10) / 10));
        updatedCmVoteCount = newCount;

        await Media.findByIdAndUpdate(mediaId, {
          cmRating: updatedCmRating,
          cmVoteCount: updatedCmVoteCount,
        });

        signal = ratingToSignal(rating);
      }
    } else {
      // ── Non-rating interactions: always create new ─────────
      interaction = await Interaction.create({
        userId: req.user.userId,
        mediaId,
        action,
        rating: null,
        timestamp: new Date(),
      });

      signal = actionToSignal(action, null);
    }

    // Link interaction to recommendation if provided
    if (recommendationId && interaction) {
      await Recommendation.findByIdAndUpdate(recommendationId, {
        interaction: interaction._id,
      });
    }

    // ── Update User Preferences (Real-time Learning) ──────────
    await applyPreferenceSignal(req.user.userId, media, signal);

    res.status(201).json({
      message: 'Interaction recorded and preferences updated.',
      interactionId: interaction._id,
      preferencesUpdated: signal !== 0,
      // Return updated aggregate for immediate frontend update
      cmRating: updatedCmRating,
      cmVoteCount: updatedCmVoteCount,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
