/**
 * onboardingHelper.js
 *
 * Provides invalidation logic for multi-step onboarding.
 * When a user goes back and makes changes to an upstream step N,
 * all downstream steps (N+1, N+2...) are reset so that:
 *  1. Stale choices based on old criteria (e.g. old languages or genres) are removed.
 *  2. Downstream confidence scores reset back to the current step's score.
 */

export function resetDownstreamOnboarding(fromStep) {
  if (fromStep <= 1) {
    sessionStorage.removeItem('ob_vibe_id');
    sessionStorage.removeItem('ob_vibe_genres');
    sessionStorage.removeItem('ob_conf_vibe');
  }
  if (fromStep <= 2) {
    sessionStorage.removeItem('ob_genres');
    sessionStorage.removeItem('ob_conf_genres');
  }
  if (fromStep <= 3) {
    sessionStorage.removeItem('ob_movie_states');
    sessionStorage.removeItem('ob_watched_ids');
    sessionStorage.removeItem('ob_conf_movies');
  }
  if (fromStep <= 4) {
    sessionStorage.removeItem('ob_actor_prefs');
    sessionStorage.removeItem('ob_conf_actors');
  }
  if (fromStep <= 5) {
    sessionStorage.removeItem('ob_director_prefs');
  }
}
