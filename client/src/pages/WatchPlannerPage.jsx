/**
 * WatchPlannerPage.jsx — Personal Cinema Planner
 *
 * Structure:
 *   1. UP NEXT HERO    — Cinematic backdrop card with live countdown & Now Playing indicator
 *   2. UNSCHEDULED     — Draggable movie cards (desktop DnD + mobile tap-to-schedule)
 *   3. 24-HOUR CALENDAR— Full 24-hour weekly timeline with proportional movie positioning
 *   4. TONIGHT'S PICK  — Preference-scored recommendation from unscheduled watchlist
 *
 * Fixes Applied:
 *   - Full 24 hours (12 AM – 11 PM) vertically scrollable (650px container).
 *   - Accurate positioning: top = (hour + min/60) * 64px; height = (runtime/60) * 64px.
 *   - Sticky day headers & sticky time gutter.
 *   - "Mark as Watched" excludes watched media from returning to the unscheduled watchlist.
 *   - Auto-scroll to evening / prime-time hours on load.
 *   - Responsive 7-day desktop grid + mobile day tabs with 24-hour vertical timeline.
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { watchPlannerApi } from '../services/api';

const TMDB_POSTER   = 'https://image.tmdb.org/t/p/w342';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w780';

// ── 24-Hour Calendar Config ────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 to 23
const SLOT_HEIGHT = 64; // Pixels per hour

function pad(n) { return String(n).padStart(2, '0'); }

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function formatTime(date) {
  const d = new Date(date);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${pad(m)} ${ampm}`;
}

function formatEndTime(date, durationMins) {
  if (!durationMins) return null;
  const end = new Date(new Date(date).getTime() + durationMins * 60 * 1000);
  return formatTime(end);
}

function formatRuntime(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`;
}

function formatCountdown(targetDate) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSecs = Math.floor(diff / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;
  return { days, hours, mins, secs };
}

function isNowPlaying(entry) {
  const start = new Date(entry.scheduledAt).getTime();
  const end   = start + ((entry.duration || 120) * 60 * 1000);
  const now   = Date.now();
  return now >= start && now < end;
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function isToday(date) { return isSameDay(date, new Date()); }

function getWeekDays(weekOffset = 0) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Start from Monday (ISO week)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatWeekRange(days) {
  if (!days || days.length === 0) return '';
  const first = days[0];
  const last  = days[6];
  const firstMonth = first.toLocaleDateString('en-US', { month: 'short' });
  const lastMonth  = last.toLocaleDateString('en-US', { month: 'short' });
  const year       = last.getFullYear();

  if (firstMonth === lastMonth) {
    return `${firstMonth} ${first.getDate()} – ${last.getDate()}, ${year}`;
  }
  return `${firstMonth} ${first.getDate()} – ${lastMonth} ${last.getDate()}, ${year}`;
}

// ── Countdown Display Component ────────────────────────────────
function Countdown({ scheduledAt }) {
  const [cd, setCd] = useState(() => formatCountdown(scheduledAt));
  useEffect(() => {
    const id = setInterval(() => setCd(formatCountdown(scheduledAt)), 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);
  if (!cd) return null;
  return (
    <div className="wp-countdown">
      <div className="wp-countdown-unit">
        <span className="wp-countdown-num">{pad(cd.days)}</span>
        <span className="wp-countdown-label">Days</span>
      </div>
      <span className="wp-countdown-colon">:</span>
      <div className="wp-countdown-unit">
        <span className="wp-countdown-num">{pad(cd.hours)}</span>
        <span className="wp-countdown-label">Hours</span>
      </div>
      <span className="wp-countdown-colon">:</span>
      <div className="wp-countdown-unit">
        <span className="wp-countdown-num">{pad(cd.mins)}</span>
        <span className="wp-countdown-label">Mins</span>
      </div>
      <span className="wp-countdown-colon">:</span>
      <div className="wp-countdown-unit">
        <span className="wp-countdown-num">{pad(cd.secs)}</span>
        <span className="wp-countdown-label">Secs</span>
      </div>
    </div>
  );
}

// ── Schedule Modal Component ───────────────────────────────────
function ScheduleModal({ media, onConfirm, onClose, loading }) {
  const poster = media?.posterPath ? `${TMDB_POSTER}${media.posterPath}` : null;
  const runtime = formatRuntime(media?.runtime);

  const defaultDt = () => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [dt, setDt] = useState(defaultDt);

  return (
    <div className="wp-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wp-modal">
        <div className="wp-modal-header">
          {poster
            ? <img src={poster} alt={media?.title} className="wp-modal-poster" />
            : <div style={{ width: 56, aspectRatio: '2/3', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', flexShrink: 0 }} />
          }
          <div>
            <div className="wp-modal-title">{media?.title}</div>
            <div className="wp-modal-subtitle">
              {media?.type === 'tv' ? 'Series' : 'Film'}
              {runtime && ` · ${runtime}`}
            </div>
          </div>
        </div>
        <div className="wp-modal-field">
          <label className="wp-modal-label" htmlFor="wp-datetime-input">
            Schedule Date & Time
          </label>
          <input
            id="wp-datetime-input"
            type="datetime-local"
            className="wp-modal-input"
            value={dt}
            onChange={e => setDt(e.target.value)}
          />
        </div>
        <div className="wp-modal-footer">
          <button className="wp-btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="wp-btn-primary"
            onClick={() => onConfirm(dt)}
            disabled={loading || !dt}
          >
            {loading ? 'Scheduling…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Block Popover Component ────────────────────────────────────
function BlockPopover({ entry, onWatched, onRemove, onReschedule, onClose, loading }) {
  const media = entry.mediaId;
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onClose]);

  return (
    <div className="wp-popover" ref={ref}>
      <div className="wp-popover-title">{media?.title || 'Scheduled Film'}</div>
      <div className="wp-popover-actions">
        <button
          className="wp-popover-btn wp-popover-btn--success"
          onClick={onWatched}
          disabled={loading}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Mark as Watched
        </button>
        <button
          className="wp-popover-btn"
          onClick={onReschedule}
          disabled={loading}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Reschedule
        </button>
        <button
          className="wp-popover-btn wp-popover-btn--danger"
          onClick={onRemove}
          disabled={loading}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Remove from Schedule
        </button>
      </div>
    </div>
  );
}

// ── Draggable Watchlist Card ───────────────────────────────────
function DragCard({ media, onScheduleClick, isMobile }) {
  const [isDragging, setIsDragging] = useState(false);
  const poster = media.posterPath ? `${TMDB_POSTER}${media.posterPath}` : null;
  const runtime = formatRuntime(media.runtime);

  return (
    <div
      id={`wp-drag-card-${media._id}`}
      className={`wp-drag-card${isDragging ? ' dragging' : ''}`}
      draggable={!isMobile}
      onDragStart={e => {
        e.dataTransfer.setData('mediaId', media._id);
        e.dataTransfer.effectAllowed = 'copy';
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      title={isMobile ? undefined : 'Drag to calendar to schedule'}
    >
      {!isMobile && <div className="wp-drag-hint">Drag to plan</div>}

      {poster
        ? <img src={poster} alt={media.title} className="wp-drag-card-poster" loading="lazy" />
        : (
          <div className="wp-drag-card-poster-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
            </svg>
          </div>
        )
      }

      <div className="wp-drag-card-info">
        <div className="wp-drag-card-title">{media.title}</div>
        <div className="wp-drag-card-meta">
          <span>{media.type === 'tv' ? 'Series' : 'Film'}</span>
          {runtime && <><span>·</span><span>{runtime}</span></>}
        </div>
      </div>

      {isMobile && (
        <button
          className="wp-schedule-btn"
          onClick={() => onScheduleClick(media)}
          aria-label={`Schedule ${media.title}`}
        >
          Schedule
        </button>
      )}
    </div>
  );
}

// ── Scheduled Movie Card (Positioned in 24-Hour Timeline) ──────
function ScheduledMovieCard({ entry, onOpenPopover }) {
  const media = entry.mediaId;
  const poster = media?.posterPath ? `${TMDB_POSTER}${media.posterPath}` : null;
  const start = new Date(entry.scheduledAt);
  const startHour = start.getHours();
  const startMin  = start.getMinutes();

  // Vertical positioning calculation
  const topPx = (startHour + startMin / 60) * SLOT_HEIGHT;
  const durationMins = entry.duration || media?.runtime || 120;
  const heightPx = Math.max(52, (durationMins / 60) * SLOT_HEIGHT - 4);

  const startStr = formatTime(entry.scheduledAt);
  const endStr   = formatEndTime(entry.scheduledAt, durationMins);
  const runtimeStr = formatRuntime(durationMins);
  const nowPlaying = isNowPlaying(entry);

  return (
    <div
      className={`wp-scheduled-movie-card${nowPlaying ? ' now-playing' : ''}`}
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onOpenPopover(entry._id);
      }}
      title={`${media?.title} (${startStr} – ${endStr})`}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpenPopover(entry._id)}
    >
      {poster
        ? <img src={poster} alt={media?.title} className="wp-movie-card-poster" />
        : (
          <div className="wp-movie-card-poster-placeholder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
            </svg>
          </div>
        )
      }
      <div className="wp-movie-card-content">
        <div className="wp-movie-card-title">{media?.title}</div>
        <div className="wp-movie-card-time">
          {nowPlaying && <span className="wp-status-badge--dot" style={{ width: 5, height: 5 }} />}
          <span>{startStr}{endStr && ` – ${endStr}`}</span>
        </div>
        {runtimeStr && heightPx > 60 && (
          <div className="wp-movie-card-duration">{runtimeStr}</div>
        )}
      </div>
    </div>
  );
}

// ── Single Hour Slot Drop Zone ─────────────────────────────────
function HourSlot({ day, hour, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`wp-cal-hour-slot${isDragOver ? ' drag-over' : ''}`}
      onDragOver={e => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragEnter={e => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setIsDragOver(false);
        const mediaId = e.dataTransfer.getData('mediaId');
        if (mediaId) {
          onDrop(mediaId, day, hour);
        }
      }}
    />
  );
}

// ── Day Column in 24-Hour Timeline ─────────────────────────────
function DayColumn({ day, scheduledEntries, onDrop, onOpenPopover }) {
  return (
    <div className={`wp-cal-day-col${isToday(day) ? ' today-col' : ''}`}>
      {/* 24 Hour Slot Drop Zones */}
      {HOURS.map(hour => (
        <HourSlot
          key={hour}
          day={day}
          hour={hour}
          onDrop={onDrop}
        />
      ))}

      {/* Render All Scheduled Movies For This Day */}
      {scheduledEntries.map(entry => (
        <ScheduledMovieCard
          key={entry._id}
          entry={entry}
          onOpenPopover={onOpenPopover}
        />
      ))}
    </div>
  );
}

// ── Main WatchPlannerPage Component ────────────────────────────
export default function WatchPlannerPage() {
  const navigate = useNavigate();
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [scheduled, setScheduled]             = useState([]);
  const [unscheduled, setUnscheduled]         = useState([]);
  const [tonightsPick, setTonightsPick]       = useState(null);
  const [weekOffset, setWeekOffset]           = useState(0);
  const [activePopoverId, setActivePopoverId] = useState(null);
  const [scheduleModal, setScheduleModal]     = useState(null);
  const [conflict, setConflict]               = useState(null);
  const [actionLoading, setActionLoading]     = useState('');
  const [tonightDismissed, setTonightDismissed] = useState(false);
  const [isMobile, setIsMobile]               = useState(false);
  const [selectedMobileDayIndex, setSelectedMobileDayIndex] = useState(0);

  const timelineScrollRef = useRef(null);

  // Screen size detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    if (!activePopoverId) return;
    const handler = e => {
      if (!e.target.closest('.wp-popover') && !e.target.closest('.wp-scheduled-movie-card')) {
        setActivePopoverId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activePopoverId]);

  // Load planner data from backend
  const load = useCallback(async () => {
    try {
      const res = await watchPlannerApi.get();
      setScheduled(res.data.scheduled || []);
      setUnscheduled(res.data.unscheduled || []);
      setTonightsPick(res.data.tonightsPick || null);
    } catch {
      setError('Could not load your planner. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Week days
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  // Default mobile selected day to Today's index within current week
  useEffect(() => {
    const todayIdx = weekDays.findIndex(d => isToday(d));
    if (todayIdx !== -1) {
      setSelectedMobileDayIndex(todayIdx);
    } else {
      setSelectedMobileDayIndex(0);
    }
  }, [weekDays]);

  // Auto-scroll calendar to evening/prime time (e.g. 5 PM / 17:00) on mount
  useEffect(() => {
    if (timelineScrollRef.current) {
      const currentHour = new Date().getHours();
      // Scroll to 5 PM (17:00) or current hour minus 1
      const scrollHour = weekOffset === 0
        ? Math.max(0, Math.min(18, currentHour - 1))
        : 17;
      timelineScrollRef.current.scrollTop = scrollHour * SLOT_HEIGHT;
    }
  }, [weekOffset, loading]);

  // ── Derived: Next scheduled entry (Up Next) ─────────────────
  const upNext = useMemo(() => {
    const active = scheduled.filter(s => {
      const start = new Date(s.scheduledAt).getTime();
      const end   = start + ((s.duration || 120) * 60000);
      return end > Date.now();
    });
    active.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    return active[0] || null;
  }, [scheduled]);

  // ── Group scheduled items by day for the active week ─────────
  const scheduledByDay = useMemo(() => {
    const map = {};
    weekDays.forEach(day => {
      const dayKey = day.toDateString();
      map[dayKey] = scheduled.filter(entry => isSameDay(entry.scheduledAt, day));
    });
    return map;
  }, [scheduled, weekDays]);

  // Active popover entry object
  const activePopoverEntry = useMemo(() => {
    return scheduled.find(s => s._id === activePopoverId) || null;
  }, [scheduled, activePopoverId]);

  // ── Drop Handler ─────────────────────────────────────────────
  const handleDrop = useCallback(async (mediaId, day, hour) => {
    const dt = new Date(day);
    dt.setHours(hour, 0, 0, 0);
    setActionLoading('drop');
    setConflict(null);
    try {
      const res = await watchPlannerApi.create({
        mediaId,
        scheduledAt: dt.toISOString(),
      });
      if (res.data.conflict) {
        setConflict(res.data.conflict.message);
        setTimeout(() => setConflict(null), 5000);
      }
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not schedule this title.';
      setConflict(msg);
      setTimeout(() => setConflict(null), 5000);
    } finally {
      setActionLoading('');
    }
  }, [load]);

  // ── Modal Schedule Confirm ───────────────────────────────────
  const handleModalConfirm = useCallback(async (dtString) => {
    if (!scheduleModal) return;
    setActionLoading('modal');
    setConflict(null);
    try {
      const res = await watchPlannerApi.create({
        mediaId: scheduleModal._id,
        scheduledAt: new Date(dtString).toISOString(),
      });
      if (res.data.conflict) {
        setConflict(res.data.conflict.message);
        setTimeout(() => setConflict(null), 5000);
      }
      setScheduleModal(null);
      await load();
    } catch (err) {
      setConflict(err.response?.data?.message || 'Could not schedule.');
      setTimeout(() => setConflict(null), 5000);
    } finally {
      setActionLoading('');
    }
  }, [scheduleModal, load]);

  // ── Mark as Watched ──────────────────────────────────────────
  const handleWatched = useCallback(async (entry) => {
    if (actionLoading) return;
    setActionLoading(`watch-${entry._id}`);
    try {
      await watchPlannerApi.update(entry._id, { status: 'watched' });
      setActivePopoverId(null);
      await load();
    } finally {
      setActionLoading('');
    }
  }, [actionLoading, load]);

  // ── Remove from Schedule ─────────────────────────────────────
  const handleRemove = useCallback(async (entry) => {
    if (actionLoading) return;
    setActionLoading(`remove-${entry._id}`);
    try {
      await watchPlannerApi.remove(entry._id);
      setActivePopoverId(null);
      await load();
    } finally {
      setActionLoading('');
    }
  }, [actionLoading, load]);

  // ── Reschedule ───────────────────────────────────────────────
  const handleReschedule = useCallback((entry) => {
    setActivePopoverId(null);
    setScheduleModal({ ...entry.mediaId, _scheduleId: entry._id });
  }, []);

  const handleRescheduleConfirm = useCallback(async (dtString) => {
    if (!scheduleModal?._scheduleId) {
      return handleModalConfirm(dtString);
    }
    setActionLoading('modal');
    try {
      await watchPlannerApi.update(scheduleModal._scheduleId, {
        scheduledAt: new Date(dtString).toISOString(),
      });
      setScheduleModal(null);
      await load();
    } catch (err) {
      setConflict(err.response?.data?.message || 'Could not reschedule.');
      setTimeout(() => setConflict(null), 4000);
    } finally {
      setActionLoading('');
    }
  }, [scheduleModal, handleModalConfirm, load]);

  // ── Tonight's Pick — Watch Tonight ───────────────────────────
  const handleWatchTonight = useCallback(async () => {
    if (!tonightsPick || actionLoading) return;
    setActionLoading('tonight');
    const base = new Date();
    base.setSeconds(0, 0);
    let hour = 20;
    while (hour <= 23 && base.getHours() >= hour) hour++;
    if (hour > 23) hour = 20;
    base.setHours(hour, 0, 0, 0);
    try {
      const res = await watchPlannerApi.create({
        mediaId: tonightsPick.media._id,
        scheduledAt: base.toISOString(),
      });
      if (res.data.conflict) {
        setConflict(res.data.conflict.message);
        setTimeout(() => setConflict(null), 4000);
      }
      setTonightDismissed(true);
      await load();
    } catch (err) {
      setConflict(err.response?.data?.message || 'Could not schedule.');
      setTimeout(() => setConflict(null), 4000);
    } finally {
      setActionLoading('');
    }
  }, [tonightsPick, actionLoading, load]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--text-muted)' }}>
          <div className="skeleton" style={{ width: '100%', height: '40vh', borderRadius: 0, position: 'fixed', top: 0, left: 0 }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" className="animate-spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const upNextMedia = upNext?.mediaId;
  const upNextBackdrop = upNextMedia?.backdropPath
    ? `${TMDB_BACKDROP}${upNextMedia.backdropPath}`
    : null;
  const upNextPoster = upNextMedia?.posterPath
    ? `${TMDB_POSTER}${upNextMedia.posterPath}`
    : null;
  const upNextRuntime = formatRuntime(upNext?.duration || upNextMedia?.runtime);
  const nowPlaying = upNext ? isNowPlaying(upNext) : false;

  const displayDays = isMobile ? [weekDays[selectedMobileDayIndex]] : weekDays;

  return (
    <div className="wp-page">

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — UP NEXT HERO
          ═══════════════════════════════════════════════════════ */}
      <div className="wp-hero">
        {upNextBackdrop && (
          <div className="wp-hero-bg" style={{ backgroundImage: `url(${upNextBackdrop})` }} />
        )}
        <div className="wp-hero-gradient" />

        {upNext ? (
          <div className="wp-hero-inner">
            {/* Poster */}
            <div className="wp-hero-poster">
              {upNextPoster
                ? <img src={upNextPoster} alt={upNextMedia?.title} />
                : (
                  <div className="wp-hero-poster-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="m8 21 4-4 4 4" />
                    </svg>
                  </div>
                )
              }
              <div className="wp-hero-poster-glow" />
            </div>

            {/* Info */}
            <div className="wp-hero-info">
              {nowPlaying ? (
                <div className="wp-status-badge wp-status-badge--now">
                  <span className="wp-status-badge--dot" />
                  Now Playing
                </div>
              ) : (
                <div className="wp-status-badge wp-status-badge--upcoming">
                  Up Next
                </div>
              )}

              <h1 className="wp-hero-title">{upNextMedia?.title}</h1>

              <div className="wp-hero-meta">
                <span>{new Date(upNext.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <span className="wp-hero-meta-sep">·</span>
                <span>{formatTime(upNext.scheduledAt)}</span>
                {upNextRuntime && (
                  <>
                    <span className="wp-hero-meta-sep">·</span>
                    <span>{upNextRuntime}</span>
                  </>
                )}
              </div>

              {!nowPlaying && <Countdown scheduledAt={upNext.scheduledAt} />}

              <div className="wp-hero-actions">
                <button
                  id="wp-mark-watched-btn"
                  className="wp-btn-primary"
                  onClick={() => handleWatched(upNext)}
                  disabled={actionLoading === `watch-${upNext._id}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {actionLoading === `watch-${upNext._id}` ? 'Saving…' : 'Mark as Watched'}
                </button>
                <button
                  id="wp-reschedule-btn"
                  className="wp-btn-ghost"
                  onClick={() => handleReschedule(upNext)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Reschedule
                </button>
                <button
                  id="wp-remove-btn"
                  className="wp-btn-danger"
                  onClick={() => handleRemove(upNext)}
                  disabled={!!actionLoading}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="wp-hero-empty">
            <div className="wp-hero-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h1 className="wp-hero-empty-title">Your Next Story Is Waiting</h1>
            <p className="wp-hero-empty-sub">
              Drag a title from your watchlist into any hour slot on the calendar below to plan your movie night.
            </p>
            {unscheduled.length === 0 && (
              <Link to="/search" className="wp-btn-primary" style={{ textDecoration: 'none', marginTop: 8 }}>
                Explore CineMatch
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          BODY
          ═══════════════════════════════════════════════════════ */}
      <div className="container" style={{ paddingTop: 'var(--space-12)' }}>

        {/* Conflict Banner */}
        {conflict && (
          <div className="wp-conflict-banner" style={{ marginBottom: 'var(--space-6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {conflict}
          </div>
        )}

        {/* ── SECTION 2 — Unscheduled Watchlist ─────────────── */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <div className="wp-section-header">
            <span className="wp-section-label">Your Watchlist ({unscheduled.length})</span>
            <div className="wp-section-line" />
            {!isMobile && unscheduled.length > 0 && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Drag onto any calendar hour to schedule
              </span>
            )}
          </div>

          {unscheduled.length > 0 ? (
            <div className="wp-watchlist-row">
              {unscheduled.map(media => (
                <DragCard
                  key={media._id}
                  media={media}
                  onScheduleClick={m => setScheduleModal(m)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ) : (
            <div className="wp-watchlist-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)" strokeWidth="1">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                No unscheduled titles in your watchlist.{' '}
                <Link to="/search" style={{ color: 'var(--gold)' }}>Explore films</Link> to add more.
              </p>
            </div>
          )}
        </div>

        {/* ── SECTION 3 — 24-Hour Cinematic Calendar ──────────── */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <div className="wp-section-header">
            <span className="wp-section-label">Your Watch Week</span>
            <div className="wp-section-line" />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              24-Hour Timeline
            </span>
          </div>

          <div className="wp-calendar-wrap">
            {/* Week Navigation Header */}
            <div className="wp-calendar-nav">
              <div className="wp-calendar-nav-left">
                <button
                  className="wp-calendar-nav-btn"
                  onClick={() => setWeekOffset(o => o - 1)}
                  aria-label="Previous week"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  className="wp-calendar-nav-btn"
                  onClick={() => setWeekOffset(o => o + 1)}
                  aria-label="Next week"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <span className="wp-calendar-nav-title">
                  {formatWeekRange(weekDays)}
                </span>
              </div>

              {weekOffset !== 0 && (
                <button
                  className="wp-calendar-today-btn"
                  onClick={() => setWeekOffset(0)}
                >
                  Today
                </button>
              )}
            </div>

            {/* Mobile Day Selector Tabs (displayed on small screens) */}
            {isMobile && (
              <div className="wp-cal-mobile-tabs">
                {weekDays.map((day, idx) => (
                  <button
                    key={day.toISOString()}
                    className={`wp-cal-mobile-tab${selectedMobileDayIndex === idx ? ' active' : ''}`}
                    onClick={() => setSelectedMobileDayIndex(idx)}
                  >
                    <span className="wp-cal-mobile-tab-name">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="wp-cal-mobile-tab-date">
                      {day.getDate()}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Scrollable 24-Hour Timeline Container */}
            <div className="wp-cal-scroll-container" ref={timelineScrollRef}>

              {/* Sticky Days Header Row */}
              <div className="wp-cal-sticky-header">
                <div className="wp-cal-corner-head">Time</div>
                <div
                  className="wp-cal-days-header-row"
                  style={isMobile ? { gridTemplateColumns: '1fr' } : undefined}
                >
                  {displayDays.map(day => (
                    <div
                      key={day.toISOString()}
                      className={`wp-cal-day-head${isToday(day) ? ' today' : ''}`}
                    >
                      <div className="wp-cal-day-name">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="wp-cal-day-date">{day.getDate()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 24-Hour Timeline Body */}
              <div className="wp-cal-timeline-body">

                {/* Sticky Time Gutter (12 AM to 11 PM) */}
                <div className="wp-cal-time-col">
                  {HOURS.map(hour => (
                    <div key={hour} className="wp-cal-time-slot-label">
                      {formatHour(hour)}
                    </div>
                  ))}
                </div>

                {/* Day Columns with Slots & Positioned Movie Cards */}
                <div
                  className="wp-cal-days-grid"
                  style={isMobile ? { gridTemplateColumns: '1fr' } : undefined}
                >
                  {displayDays.map(day => {
                    const dayKey = day.toDateString();
                    const dayEntries = scheduledByDay[dayKey] || [];
                    return (
                      <DayColumn
                        key={dayKey}
                        day={day}
                        scheduledEntries={dayEntries}
                        onDrop={handleDrop}
                        onOpenPopover={id => setActivePopoverId(id)}
                      />
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ── Block Popover Modal ───────────────────────────────── */}
        {activePopoverId && activePopoverEntry && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 60 }}
            onClick={() => setActivePopoverId(null)}
          >
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 61,
              }}
              onClick={e => e.stopPropagation()}
            >
              <BlockPopover
                entry={activePopoverEntry}
                onWatched={() => handleWatched(activePopoverEntry)}
                onRemove={() => handleRemove(activePopoverEntry)}
                onReschedule={() => handleReschedule(activePopoverEntry)}
                onClose={() => setActivePopoverId(null)}
                loading={!!actionLoading}
              />
            </div>
          </div>
        )}

        {/* ── SECTION 4 — Tonight's Pick ───────────────────────── */}
        {tonightsPick && !tonightDismissed && (
          <div style={{ marginBottom: 'var(--space-12)' }}>
            <div className="wp-section-header">
              <span className="wp-section-label">✦ Tonight's Pick</span>
              <div className="wp-section-line" />
            </div>

            <div className="wp-tonight">
              {tonightsPick.media.posterPath
                ? (
                  <img
                    src={`${TMDB_POSTER}${tonightsPick.media.posterPath}`}
                    alt={tonightsPick.media.title}
                    className="wp-tonight-poster"
                  />
                ) : (
                  <div className="wp-tonight-poster-placeholder">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                    </svg>
                  </div>
                )
              }
              <div className="wp-tonight-info">
                <span className="wp-tonight-label">CineMatch Recommendation</span>
                <h2 className="wp-tonight-title">{tonightsPick.media.title}</h2>
                {tonightsPick.reasons?.length > 0 && (
                  <div className="wp-tonight-reasons">
                    {tonightsPick.reasons.map((r, i) => (
                      <span key={i} className="wp-tonight-reason">{r}</span>
                    ))}
                  </div>
                )}
                <div className="wp-tonight-actions">
                  <button
                    id="wp-watch-tonight-btn"
                    className="wp-btn-primary"
                    onClick={handleWatchTonight}
                    disabled={actionLoading === 'tonight'}
                  >
                    {actionLoading === 'tonight' ? 'Scheduling…' : 'Watch Tonight'}
                  </button>
                  <button
                    className="wp-btn-ghost"
                    onClick={() => setTonightDismissed(true)}
                  >
                    Not Tonight
                  </button>
                  <button
                    className="wp-btn-ghost"
                    onClick={() => navigate(`/media/${tonightsPick.media._id}`)}
                    style={{ borderStyle: 'dashed' }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Schedule / Reschedule Modal ──────────────────────── */}
      {scheduleModal && (
        <ScheduleModal
          media={scheduleModal}
          onConfirm={scheduleModal._scheduleId ? handleRescheduleConfirm : handleModalConfirm}
          onClose={() => setScheduleModal(null)}
          loading={actionLoading === 'modal'}
        />
      )}

    </div>
  );
}
