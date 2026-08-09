/**
 * Recommendation Routes — /api/recommendations
 *
 * GET /api/recommendations          → Get personalized recommendations for user
 * GET /api/recommendations/similar/:mediaId → Get similar media
 *
 * In Phase 8-9, these will call the Python ML service.
 * For now (Phase 1), they return a score-based ranking using MongoDB queries
 * as a functional placeholder until the TF-IDF service is ready.
 *
 * This is important: the Node server handles the orchestration;
 * the Python service handles the heavy ML computation.
 */

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const User    = require('../models/User');
const Media   = require('../models/Media');
const Recommendation = require('../models/Recommendation');
const Interaction    = require('../models/Interaction');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── GET /api/recommendations ──────────────────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Try to call ML service first
    let recommendations = [];
    let mlServiceAvailable = false;

    try {
      const fetch = require('node-fetch');
      const mlRes = await fetch(`${ML_SERVICE_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.toString(),
          preferences: {
            languages: user.preferences.languages,
            genres: Object.fromEntries(user.preferences.genres),
            actors: Object.fromEntries(user.preferences.actors),
            directors: Object.fromEntries(user.preferences.directors),
          },
          limit: Number(limit),
        }),
        timeout: 5000,
      });

      if (mlRes.ok) {
        const mlData = await mlRes.json();
        recommendations = mlData.recommendations;
        mlServiceAvailable = true;
      }
    } catch {
      // ML service not available — fall back to preference-based query
    }

    // ── Fallback: Preference-based MongoDB query ──────────────
    if (!mlServiceAvailable || recommendations.length === 0) {
      // Get media IDs the user has already interacted with
      const interacted = await Interaction.find({ userId }).distinct('mediaId');

      // Query media matching user's preferred languages
      const preferredLanguages = user.preferences.languages;
      const query = {
        _id: { $nin: interacted },
        ...(preferredLanguages.length > 0 && { originalLanguage: { $in: preferredLanguages } }),
      };

      // Get top genres from user preferences
      const topGenres = [...user.preferences.genres.entries()]
        .filter(([, w]) => w > 0.2)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([g]) => g);

      if (topGenres.length > 0) {
        query.genres = { $in: topGenres };
      }

      const candidateMedia = await Media.find(query)
        .sort({ popularity: -1, rating: -1 })
        .limit(Number(limit))
        .select('-featureText')
        .lean();

      // Generate simple score and reasons
      recommendations = candidateMedia.map(media => {
        const reasons = [];
        const langMatch = preferredLanguages.includes(media.originalLanguage);
        if (langMatch) reasons.push(`In your preferred language (${media.originalLanguage})`);

        const matchingGenres = media.genres.filter(g => (user.preferences.genres.get(g) || 0) > 0.2);
        if (matchingGenres.length > 0) reasons.push(`Matches genres you enjoy: ${matchingGenres.join(', ')}`);
        if (media.rating >= 7) reasons.push(`Highly rated (${media.rating.toFixed(1)}/10)`);
        if (reasons.length === 0) reasons.push('Popular in your preferred region');

        return {
          media,
          score: Math.min(1, (media.popularity / 1000) * 0.4 + (media.rating / 10) * 0.3 + (langMatch ? 0.3 : 0)),
          reasons,
        };
      });
    }

    // Store recommendations in DB
    if (recommendations.length > 0) {
      const recsToStore = recommendations.map(r => ({
        userId,
        mediaId: r.media._id || r.mediaId,
        score: r.score,
        reasons: r.reasons,
        shownAt: new Date(),
      }));

      // Insert without error if duplicate
      try {
        await Recommendation.insertMany(recsToStore, { ordered: false });
      } catch { /* ignore duplicate errors */ }
    }

    res.json({
      recommendations,
      source: mlServiceAvailable ? 'ml-service' : 'fallback',
      count: recommendations.length,
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/recommendations/similar/:mediaId ─────────────────
router.get('/similar/:mediaId', auth, async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const { limit = 10 } = req.query;

    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ message: 'Media not found.' });

    // Try ML service for content similarity
    try {
      const fetch = require('node-fetch');
      const mlRes = await fetch(`${ML_SERVICE_URL}/similar/${mediaId}?limit=${limit}`, {
        timeout: 5000,
      });
      if (mlRes.ok) {
        const data = await mlRes.json();
        return res.json(data);
      }
    } catch { /* fall back */ }

    // Fallback: find media with overlapping genres from same language/industry
    const similar = await Media.find({
      _id: { $ne: mediaId },
      $or: [
        { genres: { $in: media.genres }, originalLanguage: media.originalLanguage },
        { genres: { $in: media.genres }, industry: media.industry },
      ],
    })
      .sort({ popularity: -1, rating: -1 })
      .limit(Number(limit))
      .select('-featureText')
      .lean();

    res.json({
      similar,
      basedOn: { id: mediaId, title: media.title },
      source: 'fallback',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
