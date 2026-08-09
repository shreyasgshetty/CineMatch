/**
 * Onboarding Routes — /api/onboarding
 *
 * All routes require authentication.
 * Each step saves data to the user's preferences and increments onboardingStep.
 *
 * Flow:
 * Step 1: POST /languages  → save preferred languages + derived industries
 * Step 2: POST /ratings    → save initial media ratings (bulk)
 * Step 3: POST /genres     → save genre preferences (weighted)
 * Step 4: POST /actors     → save actor preferences (weighted)
 * Step 5: POST /directors  → save director preferences + mark onboarding complete
 *
 * Why increment onboardingStep?
 * So if the user refreshes, we can route them back to where they were.
 * The frontend checks this and navigates accordingly.
 */

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const User    = require('../models/User');
const Media   = require('../models/Media');
const Interaction = require('../models/Interaction');

// Language-to-industry mapping (mirrors client-side config)
const LANGUAGE_TO_INDUSTRY = {
  kn: 'Sandalwood', te: 'Tollywood', ta: 'Kollywood',
  ml: 'Mollywood',  hi: 'Bollywood', bn: 'Bengali Cinema',
  mr: 'Marathi Cinema', pa: 'Punjabi Cinema',
  en: 'Hollywood',  ko: 'Korean Cinema', ja: 'Japanese Cinema',
  zh: 'Chinese Cinema', es: 'Spanish Cinema', fr: 'French Cinema',
};

// Learning rate for preference updates
const LEARNING_RATE = 0.08;

// ── STEP 1: Languages ─────────────────────────────────────────
router.post('/languages', auth, async (req, res, next) => {
  try {
    const { languages } = req.body;

    if (!Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ message: 'Please select at least one language.' });
    }

    const industries = [...new Set(languages.map(l => LANGUAGE_TO_INDUSTRY[l]).filter(Boolean))];

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        'preferences.languages': languages,
        'preferences.industries': industries,
        onboardingStep: Math.max(1, (await User.findById(req.user.userId)).onboardingStep),
      },
      { new: true }
    );

    // Set onboarding step to at least 1
    if (user.onboardingStep < 1) {
      user.onboardingStep = 1;
      await user.save();
    }

    res.json({
      message: 'Language preferences saved.',
      preferences: { languages, industries },
    });
  } catch (error) {
    next(error);
  }
});

// ── STEP 2: Initial Movie Ratings ─────────────────────────────
router.post('/ratings', auth, async (req, res, next) => {
  try {
    /**
     * req.body.ratings: Array of { mediaId, rating (1-5) | action: 'skipped' }
     *
     * For each rated item, we:
     * 1. Store an Interaction document
     * 2. Update user's genre/actor/director weights
     *    using: newWeight = oldWeight + LEARNING_RATE * signal
     */
    const { ratings } = req.body;

    if (!Array.isArray(ratings)) {
      return res.status(400).json({ message: 'ratings must be an array.' });
    }

    const user = await User.findById(req.user.userId);
    const interactions = [];

    for (const item of ratings) {
      const { mediaId, rating, action } = item;

      // Skip if no media ID
      if (!mediaId) continue;

      const media = await Media.findById(mediaId);
      if (!media) continue;

      // Calculate feedback signal from rating
      let signal = 0;
      let interactionAction = action || 'skipped';

      if (rating && !action) {
        interactionAction = 'rated';
        // Convert 1-5 rating to -1 to +1 signal
        signal = (rating - 3) / 2; // 5→1.0, 4→0.5, 3→0.0, 2→-0.5, 1→-1.0
      }

      interactions.push({
        userId: req.user.userId,
        mediaId,
        action: interactionAction,
        rating: rating || null,
        timestamp: new Date(),
      });

      // Only update preferences for actual ratings (not skips)
      if (interactionAction === 'rated' && signal !== 0) {
        // Update genre weights
        for (const genre of media.genres) {
          const current = user.preferences.genres.get(genre) || 0;
          user.preferences.genres.set(genre, Math.max(-1, Math.min(1, current + LEARNING_RATE * signal * 2)));
        }

        // Update actor weights
        for (const actor of media.cast.slice(0, 5)) {
          const key = String(actor.tmdbId);
          const current = user.preferences.actors.get(key) || 0;
          user.preferences.actors.set(key, Math.max(-1, Math.min(1, current + LEARNING_RATE * signal)));
        }

        // Update director weights
        for (const director of media.directors) {
          const key = String(director.tmdbId);
          const current = user.preferences.directors.get(key) || 0;
          user.preferences.directors.set(key, Math.max(-1, Math.min(1, current + LEARNING_RATE * signal * 1.5)));
        }
      }
    }

    // Save all interactions
    if (interactions.length > 0) {
      await Interaction.insertMany(interactions);
    }

    user.onboardingStep = Math.max(2, user.onboardingStep);
    await user.save();

    res.json({
      message: `${interactions.length} interactions recorded.`,
      interactionsRecorded: interactions.length,
    });
  } catch (error) {
    next(error);
  }
});

// ── STEP 3: Genre Preferences ──────────────────────────────────
router.post('/genres', auth, async (req, res, next) => {
  try {
    /**
     * req.body.genres: { "Action": "like", "Horror": "dislike", "Comedy": "neutral" }
     * Converts text preferences to numeric weights.
     */
    const { genres } = req.body;

    if (!genres || typeof genres !== 'object') {
      return res.status(400).json({ message: 'genres must be an object.' });
    }

    const signalMap = { love: 1.0, like: 0.6, neutral: 0.0, dislike: -0.6 };
    const user = await User.findById(req.user.userId);

    for (const [genre, preference] of Object.entries(genres)) {
      const signal = signalMap[preference] ?? 0;
      // Combine with existing genre weight from movie ratings
      const existing = user.preferences.genres.get(genre) || 0;
      // Give explicit genre preference more weight than inferred
      user.preferences.genres.set(genre, Math.max(-1, Math.min(1, existing * 0.3 + signal * 0.7)));
    }

    user.onboardingStep = Math.max(3, user.onboardingStep);
    await user.save();

    res.json({ message: 'Genre preferences saved.' });
  } catch (error) {
    next(error);
  }
});

// ── STEP 4: Actor Preferences ──────────────────────────────────
router.post('/actors', auth, async (req, res, next) => {
  try {
    /**
     * req.body.actors: [{ tmdbId, name, preference: "love"|"like"|"neutral"|"dislike" }]
     */
    const { actors } = req.body;

    if (!Array.isArray(actors)) {
      return res.status(400).json({ message: 'actors must be an array.' });
    }

    const signalMap = { love: 1.0, like: 0.6, neutral: 0.0, dislike: -0.6 };
    const user = await User.findById(req.user.userId);

    for (const { tmdbId, preference } of actors) {
      if (!tmdbId) continue;
      const signal = signalMap[preference] ?? 0;
      const key = String(tmdbId);
      const existing = user.preferences.actors.get(key) || 0;
      user.preferences.actors.set(key, Math.max(-1, Math.min(1, existing * 0.4 + signal * 0.6)));
    }

    user.onboardingStep = Math.max(4, user.onboardingStep);
    await user.save();

    res.json({ message: 'Actor preferences saved.' });
  } catch (error) {
    next(error);
  }
});

// ── STEP 5: Director Preferences + Complete Onboarding ─────────
router.post('/directors', auth, async (req, res, next) => {
  try {
    const { directors } = req.body;

    if (!Array.isArray(directors)) {
      return res.status(400).json({ message: 'directors must be an array.' });
    }

    const signalMap = { love: 1.0, like: 0.6, neutral: 0.0, dislike: -0.6 };
    const user = await User.findById(req.user.userId);

    for (const { tmdbId, preference } of directors) {
      if (!tmdbId) continue;
      const signal = signalMap[preference] ?? 0;
      const key = String(tmdbId);
      const existing = user.preferences.directors.get(key) || 0;
      user.preferences.directors.set(key, Math.max(-1, Math.min(1, existing * 0.4 + signal * 0.6)));
    }

    // Mark onboarding as complete
    user.onboardingCompleted = true;
    user.onboardingStep = 5;
    await user.save();

    res.json({
      message: 'Onboarding complete! Welcome to CineMatch.',
      onboardingCompleted: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
