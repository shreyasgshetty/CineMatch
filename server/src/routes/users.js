/**
 * User Routes — /api/users
 * Reference Routes — /api/genres, /api/languages, /api/industries
 */

// ── users.js ──────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const User    = require('../models/User');
const Interaction = require('../models/Interaction');

// GET /api/users/profile
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const [totalInteractions, recentInteractions] = await Promise.all([
      Interaction.countDocuments({ userId: req.user.userId }),
      Interaction.find({ userId: req.user.userId })
        .sort({ timestamp: -1 })
        .limit(5)
        .populate('mediaId', 'title posterPath type')
        .lean(),
    ]);

    res.json({
      user: user.toSafeObject(),
      stats: { totalInteractions },
      recentActivity: recentInteractions,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/preferences
router.put('/preferences', auth, async (req, res, next) => {
  try {
    const { languages, genres, actors, directors } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (languages) user.preferences.languages = languages;
    if (genres)    user.preferences.genres = new Map(Object.entries(genres));
    if (actors)    user.preferences.actors = new Map(Object.entries(actors));
    if (directors) user.preferences.directors = new Map(Object.entries(directors));

    await user.save();

    res.json({ message: 'Preferences updated.', user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
