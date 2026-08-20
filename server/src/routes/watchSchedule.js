/**
 * Watch Schedule Routes — /api/watch-schedule
 *
 * GET  /api/watch-schedule          → User's planner data (schedule + unscheduled watchlist + Tonight's Pick)
 * POST /api/watch-schedule          → Create a new schedule entry
 * PUT  /api/watch-schedule/:id      → Update scheduledAt or status
 * DELETE /api/watch-schedule/:id    → Remove/cancel a schedule entry
 *
 * ── Watchlist Deduplication & Watched Exclusion Logic ─────────────────────────
 * Active Watchlist = interested media MINUS watched media MINUS scheduled media.
 *   - Fetches all watched media IDs from both Interaction (action: 'watched') and WatchSchedule (status: 'watched').
 *   - Resolves latest interaction per mediaId: if latest is not_interested or watched, excluded.
 *   - Genuinely unwatched, unscheduled items are returned.
 *   - Tonight's Pick only selects from this clean unscheduled list.
 *
 * ── Mark as Watched Idempotency ───────────────────────────────────────────────
 * PUT with status='watched':
 *   - Checks current status before acting — if already 'watched', returns without creating duplicate.
 *   - Updates schedule.status to 'watched'.
 *   - Records interaction with action='watched' if not already present.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WatchSchedule = require('../models/WatchSchedule');
const Media = require('../models/Media');
const User = require('../models/User');
const Interaction = require('../models/Interaction');
const mongoose = require('mongoose');

// ── GET /api/watch-schedule ───────────────────────────────────
// Returns:
//   scheduled:   active WatchSchedule entries populated with media
//   unscheduled: unique watchlisted media NOT currently scheduled and NOT watched
//   tonightsPick: best unscheduled item by real preference score
router.get('/', auth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userObjId = mongoose.Types.ObjectId.createFromHexString(userId);

    // ── 1. Fetch active scheduled entries ────────────────────
    const scheduled = await WatchSchedule.find({ userId, status: 'scheduled' })
      .sort({ scheduledAt: 1 })
      .populate({
        path: 'mediaId',
        select: '-featureText',
      })
      .lean();

    const scheduledMediaIds = new Set(
      scheduled.map(s => s.mediaId?._id?.toString()).filter(Boolean)
    );

    // ── 2. Collect ALL watched media IDs for this user ───────
    const [watchedInteractions, watchedSchedules] = await Promise.all([
      Interaction.find({ userId, action: 'watched' }).distinct('mediaId'),
      WatchSchedule.find({ userId, status: 'watched' }).distinct('mediaId'),
    ]);

    const watchedMediaIds = new Set([
      ...watchedInteractions.map(id => id.toString()),
      ...watchedSchedules.map(id => id.toString()),
    ]);

    // ── 3. Resolve unique active watchlist via aggregation ────
    // Groups by mediaId, picks the latest interaction per (userId, mediaId)
    const watchlistDocs = await Interaction.aggregate([
      {
        $match: {
          userId: userObjId,
          action: { $in: ['interested', 'not_interested', 'watched'] },
        },
      },
      // Sort descending by timestamp so $first picks the most recent interaction
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$mediaId',
          latestAction: { $first: '$action' },
          latestTimestamp: { $first: '$timestamp' },
        },
      },
      // Only keep items whose most recent interaction is 'interested'
      { $match: { latestAction: 'interested' } },
      {
        $lookup: {
          from: 'media',
          localField: '_id',
          foreignField: '_id',
          as: 'media',
        },
      },
      { $unwind: '$media' },
      {
        $project: {
          _id: 0,
          media: { $mergeObjects: ['$media', { featureText: '$$REMOVE' }] },
          latestTimestamp: 1,
        },
      },
    ]);

    // Filter out items that are currently actively scheduled OR marked as watched
    const unscheduled = watchlistDocs
      .filter(doc => {
        const mediaIdStr = doc.media._id?.toString();
        return (
          mediaIdStr &&
          !scheduledMediaIds.has(mediaIdStr) &&
          !watchedMediaIds.has(mediaIdStr)
        );
      })
      .map(doc => doc.media);

    // ── 4. Tonight's Pick — scored on real data ───────────────
    let tonightsPick = null;
    if (unscheduled.length > 0) {
      const user = await User.findById(userId).select('preferences').lean();
      const genrePrefs = user?.preferences?.genres
        ? Object.fromEntries(
            Object.entries(user.preferences.genres).filter(([, v]) => typeof v === 'number')
          )
        : {};
      const langPrefs = user?.preferences?.languages || [];

      // Score each unscheduled media item
      const scored = unscheduled.map(media => {
        let score = 0;
        const reasons = [];

        // Genre weight contribution
        const genreScore = (media.genres || []).reduce((sum, g) => {
          return sum + (genrePrefs[g] || 0);
        }, 0);
        if (genreScore > 0) {
          score += genreScore * 0.5;
          const topGenres = (media.genres || [])
            .filter(g => (genrePrefs[g] || 0) > 0.2)
            .slice(0, 2);
          if (topGenres.length > 0) {
            reasons.push(`Matches your interest in ${topGenres.join(' & ')}`);
          }
        }

        // Language preference bonus
        if (langPrefs.includes(media.originalLanguage)) {
          score += 0.25;
          reasons.push(`In your preferred language`);
        }

        // Community rating (prefer CineMatch, fall back to TMDB normalized)
        const ratingScore = media.cmRating > 0
          ? (media.cmRating / 5) * 0.25
          : (media.rating / 10) * 0.15;
        score += ratingScore;
        if (media.cmRating > 3.5 || media.rating >= 7.5) {
          reasons.push(`Highly rated`);
        }

        // Popularity bonus (small weight)
        score += Math.min((media.popularity || 0) / 5000, 0.1);

        if (reasons.length === 0) {
          reasons.push('A well-rated title in your watchlist');
        }

        return { media, score, reasons: reasons.slice(0, 2) };
      });

      scored.sort((a, b) => b.score - a.score);
      if (scored.length > 0) {
        tonightsPick = {
          media: scored[0].media,
          reasons: scored[0].reasons,
        };
      }
    }

    res.json({ scheduled, unscheduled, tonightsPick });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/watch-schedule ──────────────────────────────────
// Create a new schedule entry.
// Checks: media exists, no duplicate active schedule, optional overlap warning.
router.post('/', auth, async (req, res, next) => {
  try {
    const { mediaId, scheduledAt } = req.body;
    const userId = req.user.userId;

    if (!mediaId || !scheduledAt) {
      return res.status(400).json({ message: 'mediaId and scheduledAt are required.' });
    }

    const schedDate = new Date(scheduledAt);
    if (isNaN(schedDate.getTime())) {
      return res.status(400).json({ message: 'scheduledAt must be a valid date.' });
    }

    // Verify media exists
    const media = await Media.findById(mediaId).select('title runtime').lean();
    if (!media) {
      return res.status(404).json({ message: 'Media not found.' });
    }

    // Check for duplicate active schedule for same media
    const existingActive = await WatchSchedule.findOne({
      userId,
      mediaId,
      status: 'scheduled',
    });
    if (existingActive) {
      return res.status(409).json({
        message: `"${media.title}" is already scheduled.`,
        existing: existingActive,
      });
    }

    const duration = media.runtime || 120;
    const schedEndMs = schedDate.getTime() + (duration * 60 * 1000);

    // Check for time-overlap conflicts with existing scheduled items
    const userScheduled = await WatchSchedule.find({
      userId,
      status: 'scheduled',
    }).lean();

    let conflict = null;
    for (const entry of userScheduled) {
      const entryStart = new Date(entry.scheduledAt).getTime();
      const entryEnd = entryStart + ((entry.duration || 120) * 60 * 1000);
      const newStart = schedDate.getTime();

      const overlaps = newStart < entryEnd && schedEndMs > entryStart;
      if (overlaps) {
        conflict = entry;
        break;
      }
    }

    const schedule = await WatchSchedule.create({
      userId,
      mediaId,
      scheduledAt: schedDate,
      duration,
      status: 'scheduled',
    });

    const populated = await WatchSchedule.findById(schedule._id)
      .populate({ path: 'mediaId', select: '-featureText' })
      .lean();

    res.status(201).json({
      schedule: populated,
      conflict: conflict
        ? { message: 'This overlaps with another scheduled item.', entry: conflict }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/watch-schedule/:id ───────────────────────────────
// Update scheduledAt (reschedule) or status (mark watched/cancel).
// Mark as Watched is idempotent: ensures watched status and exclusion from active watchlist.
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { scheduledAt, status } = req.body;
    const userId = req.user.userId;

    const schedule = await WatchSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule entry not found.' });
    }
    if (schedule.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // ── Mark as Watched — idempotent ─────────────────────────
    if (status === 'watched') {
      if (schedule.status === 'watched') {
        return res.json({ schedule, alreadyWatched: true });
      }

      schedule.status = 'watched';
      await schedule.save();

      // Record watched interaction if not already recorded
      const existingWatched = await Interaction.findOne({
        userId,
        mediaId: schedule.mediaId,
        action: 'watched',
      });

      if (!existingWatched) {
        await Interaction.create({
          userId,
          mediaId: schedule.mediaId,
          action: 'watched',
          rating: null,
          timestamp: new Date(),
        });
      }

      return res.json({ schedule, interactionRecorded: !existingWatched });
    }

    // ── Cancel ────────────────────────────────────────────────
    if (status === 'cancelled') {
      schedule.status = 'cancelled';
      await schedule.save();
      return res.json({ schedule });
    }

    // ── Reschedule ────────────────────────────────────────────
    if (scheduledAt) {
      const newDate = new Date(scheduledAt);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({ message: 'scheduledAt must be a valid date.' });
      }
      schedule.scheduledAt = newDate;
      await schedule.save();
    }

    const updated = await WatchSchedule.findById(schedule._id)
      .populate({ path: 'mediaId', select: '-featureText' })
      .lean();

    res.json({ schedule: updated });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/watch-schedule/:id ───────────────────────────
// Hard-deletes a schedule entry. Ownership enforced.
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const schedule = await WatchSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule entry not found.' });
    }
    if (schedule.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    await WatchSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed from schedule.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
