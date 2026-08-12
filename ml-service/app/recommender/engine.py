"""
Recommendation Engine
=====================
Core TF-IDF + cosine similarity engine.

Data flow:
  MongoDB (media.featureText) → TF-IDF matrix (sparse) → cosine similarity

For /recommend:
  1. Fetch user's rated media IDs from Interaction collection
  2. Retrieve their TF-IDF vectors from the pre-built matrix
  3. Compute a weighted average "taste vector" (higher star rating = more weight)
  4. Cosine similarity of taste vector vs all other docs
  5. Re-rank with explicit preference boost (genres/actors/directors weights)
  6. Return top-N with reasons

For /similar:
  1. Find row index for the given media _id
  2. Cosine similarity of that row vs all others
  3. Return top-N (excluding itself)
"""

import logging
import asyncio
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize
from scipy.sparse import csr_matrix

from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)


class RecommendationEngine:
    def __init__(self):
        self.vectorizer: TfidfVectorizer | None = None
        self.tfidf_matrix = None          # sparse (n_docs, n_terms)
        self.media_index: list[dict] = [] # [{_id, title, type, lang, genres, cast_ids, dir_ids, ...}]
        self.id_to_idx: dict[str, int] = {}  # mongo _id string → row index

    # ── Build ──────────────────────────────────────────────────────
    async def build(self):
        """Load corpus from MongoDB and fit TF-IDF matrix."""
        db = get_db()

        logger.info("Loading media corpus from MongoDB...")
        cursor = db["media"].find(
            {"featureText": {"$exists": True, "$ne": ""}},
            {
                "_id": 1, "title": 1, "type": 1, "originalLanguage": 1,
                "industry": 1, "genres": 1, "rating": 1, "voteCount": 1,
                "popularity": 1, "releaseYear": 1, "posterPath": 1,
                "backdropPath": 1, "overview": 1, "releaseDate": 1,
                "cast": 1, "directors": 1, "featureText": 1,
            }
        )

        documents: list[str] = []
        async for doc in cursor:
            idx = len(self.media_index)
            _id = str(doc["_id"])
            self.id_to_idx[_id] = idx
            self.media_index.append({
                "_id":              _id,
                "title":            doc.get("title", ""),
                "type":             doc.get("type", "movie"),
                "originalLanguage": doc.get("originalLanguage", ""),
                "industry":         doc.get("industry", ""),
                "genres":           doc.get("genres", []),
                "rating":           doc.get("rating", 0),
                "voteCount":        doc.get("voteCount", 0),
                "popularity":       doc.get("popularity", 0),
                "releaseYear":      doc.get("releaseYear"),
                "posterPath":       doc.get("posterPath", ""),
                "backdropPath":     doc.get("backdropPath", ""),
                "overview":         doc.get("overview", ""),
                "releaseDate":      doc.get("releaseDate", ""),
                # Cast/director IDs for preference boosting
                "cast_ids":     [str(c.get("tmdbId", "")) for c in doc.get("cast", [])],
                "director_ids": [str(d.get("tmdbId", "")) for d in doc.get("directors", [])],
            })
            documents.append(doc.get("featureText", ""))

        logger.info(f"Loaded {len(documents):,} documents. Fitting TF-IDF...")

        self.vectorizer = TfidfVectorizer(
            max_features=settings.TFIDF_MAX_FEATURES,
            min_df=settings.TFIDF_MIN_DF,
            ngram_range=(1, settings.TFIDF_NGRAM_MAX),
            sublinear_tf=True,
            strip_accents="unicode",
            analyzer="word",
            # Unicode-aware: matches any word char (Latin + Indic + CJK)
            token_pattern=r"(?u)\b\w\w+\b",
        )

        loop = asyncio.get_event_loop()
        self.tfidf_matrix = await loop.run_in_executor(
            None, self.vectorizer.fit_transform, documents
        )
        # L2-normalize rows so dot product == cosine similarity
        self.tfidf_matrix = normalize(self.tfidf_matrix, norm="l2", copy=False)

        logger.info(f"TF-IDF matrix: {self.tfidf_matrix.shape} | nnz={self.tfidf_matrix.nnz:,}")

    @property
    def corpus_size(self) -> int:
        return len(self.media_index)

    # ── Cosine Similarity Helpers ──────────────────────────────────
    def _cos_sim_vector(self, query_vec) -> np.ndarray:
        """
        Compute cosine similarity between a query vector and all corpus rows.
        Since rows are L2-normalized, cos_sim = dot product.
        Returns 1-D numpy array of length n_docs.
        """
        # query_vec may be sparse or dense; ensure it's a (1, n_terms) sparse row
        if not hasattr(query_vec, "toarray"):
            query_vec = csr_matrix(query_vec)
        scores = (self.tfidf_matrix @ query_vec.T).toarray().ravel()
        return scores

    def _preference_boost(self, idx: int, genres: dict, actors: dict, directors: dict) -> float:
        """
        Compute a [0, 1] boost for a media item based on user's explicit preference weights.
        genres:    { "Action": 0.85, "Drama": -0.3 }
        actors:    { "12345": 0.9 }   (keyed by TMDB person ID string)
        directors: { "67890": 0.7 }
        """
        doc = self.media_index[idx]
        boost = 0.0
        count = 0

        for g in doc["genres"]:
            w = genres.get(g, 0.0)
            boost += w
            count += 1

        for aid in doc["cast_ids"]:
            w = actors.get(aid, 0.0)
            if w != 0:
                boost += w
                count += 1

        for did in doc["director_ids"]:
            w = directors.get(did, 0.0)
            if w != 0:
                boost += w
                count += 1

        if count == 0:
            return 0.0

        raw = boost / count
        # Clamp to [0, 1] — negatives penalize, positives reward
        return max(-1.0, min(1.0, raw))

    # ── Public: Recommend ──────────────────────────────────────────
    async def recommend(
        self,
        user_id: str,
        preferences: dict,
        limit: int = 20,
    ) -> list[dict]:
        """
        Return top-N personalized recommendations for a user.

        Algorithm:
        1. Fetch user's rated interactions from DB
        2. Build taste vector: weighted avg of TF-IDF rows for rated media
        3. Compute cosine similarity vs all corpus docs
        4. Re-rank with preference boost
        5. Filter out already-interacted media
        6. Return top-N with reasons
        """
        db = get_db()

        languages: list[str]  = preferences.get("languages", [])
        genres:    dict        = preferences.get("genres", {})
        actors:    dict        = preferences.get("actors", {})
        directors: dict        = preferences.get("directors", {})

        # ── Step 1: Fetch user interactions ───────────────────────
        from bson import ObjectId
        try:
            uid = ObjectId(user_id)
        except Exception:
            uid = user_id

        interactions = []
        async for doc in db["interactions"].find(
            {"userId": uid, "action": "rated", "rating": {"$gte": 1}},
            {"mediaId": 1, "rating": 1}
        ):
            interactions.append(doc)

        interacted_ids: set[str] = set()
        async for doc in db["interactions"].find(
            {"userId": uid},
            {"mediaId": 1}
        ):
            interacted_ids.add(str(doc["mediaId"]))

        # ── Step 2: Build taste vector ─────────────────────────────
        taste_vec = None

        if interactions:
            rated_rows = []
            weights    = []
            for inter in interactions:
                mid_str = str(inter["mediaId"])
                if mid_str in self.id_to_idx:
                    idx = self.id_to_idx[mid_str]
                    rated_rows.append(self.tfidf_matrix[idx])
                    # Star 1-5 → weight: subtract 2.5 baseline so 3★ = neutral
                    weights.append(float(inter["rating"]) - 2.5)

            if rated_rows:
                # Weighted average of sparse rows
                weight_sum = sum(abs(w) for w in weights) or 1.0
                taste_vec = csr_matrix(rated_rows[0].shape)
                for row, w in zip(rated_rows, weights):
                    taste_vec = taste_vec + row.multiply(w / weight_sum)
                taste_vec = normalize(taste_vec, norm="l2")

        # ── Step 3: Cosine similarity ──────────────────────────────
        if taste_vec is not None:
            content_scores = self._cos_sim_vector(taste_vec)
        else:
            # Cold-start: score = 0 for everyone (preference boost drives ranking)
            content_scores = np.zeros(len(self.media_index), dtype=np.float32)

        # ── Step 4: Re-rank with preference boost ──────────────────
        lang_set = set(languages)
        final_scores  = np.empty(len(self.media_index), dtype=np.float64)
        pref_scores   = np.empty(len(self.media_index), dtype=np.float64)

        for i, doc in enumerate(self.media_index):
            pref = self._preference_boost(i, genres, actors, directors)
            # Language affinity bonus
            lang_bonus = 0.15 if doc["originalLanguage"] in lang_set else 0.0
            pref_scores[i] = pref
            final_scores[i] = (
                settings.CONTENT_WEIGHT * float(content_scores[i])
                + settings.PREF_WEIGHT  * pref
                + lang_bonus
            )

        # ── Step 5: Filter & sort ──────────────────────────────────
        top_indices = np.argsort(final_scores)[::-1]

        results = []
        for idx in top_indices:
            if len(results) >= limit:
                break

            doc = self.media_index[idx]
            if doc["_id"] in interacted_ids:
                continue
            if final_scores[idx] < settings.MIN_SIMILARITY and taste_vec is not None:
                continue

            # Language filter — only show preferred languages if specified
            if lang_set and doc["originalLanguage"] not in lang_set:
                continue

            results.append({
                "media":  self._doc_to_response(doc),
                "score":  round(float(final_scores[idx]), 4),
                "reasons": self._build_reasons(
                    doc, float(content_scores[idx]), pref_scores[idx],
                    lang_set, genres, actors, directors
                ),
            })

        return results

    # ── Public: Similar ────────────────────────────────────────────
    def similar(self, media_id: str, limit: int = 12) -> list[dict]:
        """
        Return top-N most similar items to the given media_id.
        Uses the pre-built TF-IDF matrix — O(n_terms) per query.
        """
        if media_id not in self.id_to_idx:
            return []

        src_idx = self.id_to_idx[media_id]
        query_vec = self.tfidf_matrix[src_idx]
        scores = self._cos_sim_vector(query_vec)

        # Exclude self
        scores[src_idx] = -1.0

        top_indices = np.argsort(scores)[::-1][:limit * 2]

        src_lang = self.media_index[src_idx]["originalLanguage"]
        results = []
        for idx in top_indices:
            if len(results) >= limit:
                break
            doc  = self.media_index[idx]
            sim  = float(scores[idx])
            if sim < 0.01:
                break
            results.append({
                **self._doc_to_response(doc),
                "similarity": round(sim, 4),
            })

        return results

    # ── Helpers ────────────────────────────────────────────────────
    def _doc_to_response(self, doc: dict) -> dict:
        return {
            "_id":              doc["_id"],
            "title":            doc["title"],
            "type":             doc["type"],
            "originalLanguage": doc["originalLanguage"],
            "industry":         doc["industry"],
            "genres":           doc["genres"],
            "rating":           doc["rating"],
            "voteCount":        doc["voteCount"],
            "popularity":       doc["popularity"],
            "releaseYear":      doc["releaseYear"],
            "releaseDate":      doc["releaseDate"],
            "posterPath":       doc["posterPath"],
            "backdropPath":     doc["backdropPath"],
            "overview":         doc["overview"],
        }

    def _build_reasons(
        self, doc: dict, cos_sim: float, pref_score: float,
        lang_set: set, genres: dict, actors: dict, directors: dict
    ) -> list[str]:
        reasons = []

        if doc["originalLanguage"] in lang_set:
            reasons.append(f"In your preferred language")

        matching_genres = [g for g in doc["genres"] if genres.get(g, 0) > 0.3]
        if matching_genres:
            top = matching_genres[:2]
            reasons.append(f"Matches {', '.join(top)}")

        liked_directors = [did for did in doc["director_ids"] if directors.get(did, 0) > 0.5]
        if liked_directors:
            reasons.append("By a director you like")

        liked_actors = [aid for aid in doc["cast_ids"] if actors.get(aid, 0) > 0.5]
        if liked_actors:
            reasons.append("Stars an actor you enjoy")

        if doc["rating"] >= 8.0:
            reasons.append(f"Critically acclaimed ({doc['rating']:.1f}★)")
        elif doc["rating"] >= 7.0:
            reasons.append(f"Highly rated ({doc['rating']:.1f}★)")

        if cos_sim > 0.4:
            reasons.append("Very similar to titles you loved")
        elif cos_sim > 0.2:
            reasons.append("Similar to titles you've rated")

        if not reasons:
            reasons.append("Popular in your preferred region")

        return reasons[:4]  # Max 4 reasons per card
