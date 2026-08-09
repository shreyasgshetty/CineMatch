/**
 * Interaction Routes — /api/interactions
 *
 * POST /api/interactions
 *
 * Records user feedback on a media item and immediately updates
 * the user's preference vector (the feedback loop).
 *
 * This is the real-time learning component of CineMatch.
 * After every interaction, the user profile is updated using:
 * newWeight = oldWeight + LEARNING_RATE * feedbackSignal
 *
 * This does NOT retrain the ML model — only updates the user profile.
 * The TF-IDF matrix is precomputed; what changes is the scoring weights.
 */

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const User    = require('../models/User');
const Media   = require('../models/Media');
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

    // Store interaction
    const interaction = await Interaction.create({
      userId: req.user.userId,
      mediaId,
      action,
      rating: action === 'rated' ? rating : null,
      timestamp: new Date(),
    });

    // Link interaction to recommendation if provided
    if (recommendationId) {
      await Recommendation.findByIdAndUpdate(recommendationId, {
        interaction: interaction._id,
      });
    }

    // ── Update User Preferences (Real-time Learning) ──────────
    const signal = actionToSignal(action, rating);

    if (signal !== 0) {
      const user = await User.findById(req.user.userId);

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

    res.status(201).json({
      message: 'Interaction recorded and preferences updated.',
      interactionId: interaction._id,
      preferencesUpdated: signal !== 0,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
