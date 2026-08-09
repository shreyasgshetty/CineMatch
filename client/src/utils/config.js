/**
 * CineMatch — Language & Industry Configuration
 *
 * This is the single source of truth for all supported languages and their
 * corresponding film industries. Used by onboarding, filters, and data ingestion.
 */

export const LANGUAGES = [
  { code: 'kn', label: 'Kannada', emoji: '🏔️', industry: 'Sandalwood', region: 'Indian' },
  { code: 'te', label: 'Telugu',  emoji: '🌿', industry: 'Tollywood', region: 'Indian' },
  { code: 'ta', label: 'Tamil',   emoji: '🌊', industry: 'Kollywood', region: 'Indian' },
  { code: 'ml', label: 'Malayalam', emoji: '🌴', industry: 'Mollywood', region: 'Indian' },
  { code: 'hi', label: 'Hindi',   emoji: '🎭', industry: 'Bollywood', region: 'Indian' },
  { code: 'bn', label: 'Bengali', emoji: '🌸', industry: 'Bengali Cinema', region: 'Indian' },
  { code: 'mr', label: 'Marathi', emoji: '🏯', industry: 'Marathi Cinema', region: 'Indian' },
  { code: 'pa', label: 'Punjabi', emoji: '🌾', industry: 'Punjabi Cinema', region: 'Indian' },
  { code: 'en', label: 'English', emoji: '🎬', industry: 'Hollywood', region: 'International' },
  { code: 'ko', label: 'Korean',  emoji: '🏙️', industry: 'Korean Cinema', region: 'International' },
  { code: 'ja', label: 'Japanese', emoji: '🌸', industry: 'Japanese Cinema', region: 'International' },
  { code: 'zh', label: 'Chinese', emoji: '🐲', industry: 'Chinese Cinema', region: 'International' },
  { code: 'es', label: 'Spanish', emoji: '💃', industry: 'Spanish Cinema', region: 'International' },
  { code: 'fr', label: 'French',  emoji: '🗼', industry: 'French Cinema', region: 'International' },
];

/** Map of language code → industry name */
export const LANGUAGE_TO_INDUSTRY = Object.fromEntries(
  LANGUAGES.map(l => [l.code, l.industry])
);

/** Map of language code → language label */
export const LANGUAGE_LABELS = Object.fromEntries(
  LANGUAGES.map(l => [l.code, l.label])
);

/** Indian vs International grouping */
export const INDIAN_LANGUAGE_CODES = LANGUAGES
  .filter(l => l.region === 'Indian')
  .map(l => l.code);

export const INTERNATIONAL_LANGUAGE_CODES = LANGUAGES
  .filter(l => l.region === 'International')
  .map(l => l.code);

/** All supported genres (TMDB IDs mapped to labels) */
export const GENRES = [
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14,    name: 'Fantasy' },
  { id: 36,    name: 'History' },
  { id: 27,    name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648,  name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Sci-Fi' },
  { id: 10770, name: 'TV Movie' },
  { id: 53,    name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37,    name: 'Western' },
];

/** Genre name → emoji mapping for UI */
export const GENRE_EMOJIS = {
  Action: '💥', Adventure: '🗺️', Animation: '🎨', Comedy: '😂',
  Crime: '🔍', Documentary: '📽️', Drama: '🎭', Family: '👨‍👩‍👧',
  Fantasy: '🧙', History: '📜', Horror: '👻', Music: '🎵',
  Mystery: '🕵️', Romance: '❤️', 'Sci-Fi': '🚀', Thriller: '😰',
  War: '⚔️', Western: '🤠',
};

/** Recommendation scoring weights — configurable */
export const SCORING_WEIGHTS = {
  contentSimilarity: 0.25,
  languageMatch: 0.15,
  genreMatch: 0.20,
  actorMatch: 0.20,
  directorMatch: 0.10,
  popularityScore: 0.05,
  ratingScore: 0.05,
};

/** Learning rate for preference updates after feedback */
export const LEARNING_RATE = 0.08;

/** Preference feedback signal values */
export const FEEDBACK_SIGNALS = {
  love: 1.0,
  like: 0.6,
  neutral: 0.0,
  dislike: -0.6,
  hate: -1.0,
};

/** Rating to signal mapping */
export const RATING_TO_SIGNAL = (rating) => {
  if (rating >= 5) return 1.0;
  if (rating >= 4) return 0.6;
  if (rating >= 3) return 0.2;
  if (rating >= 2) return -0.3;
  return -0.7;
};
