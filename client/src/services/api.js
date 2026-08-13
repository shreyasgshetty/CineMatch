/**
 * Axios API Service
 *
 * All API calls go through this single instance.
 * - Automatically attaches JWT token from localStorage
 * - Intercepts 401 errors and logs the user out
 * - Uses VITE_API_URL for the base URL (never expose TMDB key here)
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach JWT ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cinematch_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cinematch_token');
      localStorage.removeItem('cinematch_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth Endpoints ───────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Media Endpoints ──────────────────────────────────────────
export const mediaApi = {
  list: (params) => api.get('/media', { params }),
  getById: (id) => api.get(`/media/${id}`),
  search: (params) => api.get('/media/search', { params }),
  searchPeople: (params) => api.get('/media/people', { params }),
};


// ── Reference Data ───────────────────────────────────────────
export const refApi = {
  genres: () => api.get('/genres'),
  languages: () => api.get('/languages'),
  industries: () => api.get('/industries'),
};

// ── Onboarding Endpoints ─────────────────────────────────────
export const onboardingApi = {
  saveLanguages: (data) => api.post('/onboarding/languages', data),
  saveRatings: (data) => api.post('/onboarding/ratings', data),
  saveGenres: (data) => api.post('/onboarding/genres', data),
  saveActors: (data) => api.post('/onboarding/actors', data),
  saveDirectors: (data) => api.post('/onboarding/directors', data),
  getLanguagePreviews: () => api.get('/onboarding/language-previews'),
  getGenrePreviews: (params) => api.get('/onboarding/genre-previews', { params }),
  getMovieSuggestions: (params) => api.get('/onboarding/movie-suggestions', { params }),
  getPeopleSuggestions: (params) => api.get('/onboarding/people-suggestions', { params }),

};


// ── Recommendation Endpoints ─────────────────────────────────
export const recommendationApi = {
  get: (params) => api.get('/recommendations', { params }),
  getSimilar: (mediaId) => api.get(`/recommendations/similar/${mediaId}`),
};

// ── Interaction Endpoints ────────────────────────────────────
export const interactionApi = {
  record: (data) => api.post('/interactions', data),
  getForMedia: (mediaId) =>
    api.get(`/interactions/${mediaId}`),
};

// ── User Endpoints ───────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updatePreferences: (data) => api.put('/users/preferences', data),
};

export default api;
