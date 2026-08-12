"""Configuration — reads from .env (same file as the Node server)."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load the server's .env so we share one config file
_env_path = Path(__file__).resolve().parents[3] / "server" / ".env"
load_dotenv(_env_path)


class Settings:
    MONGO_URI: str      = os.getenv("MONGODB_URI", "mongodb://localhost:27017/test")
    DB_NAME: str        = os.getenv("DB_NAME", "test")   # Mongoose default when URI has no DB path
    PORT: int           = int(os.getenv("ML_PORT", "8000"))
    HOST: str           = os.getenv("ML_HOST", "0.0.0.0")

    # TF-IDF params
    TFIDF_MAX_FEATURES: int = 60_000   # vocabulary cap
    TFIDF_MIN_DF: int       = 2        # ignore terms appearing in < 2 docs
    TFIDF_NGRAM_MAX: int    = 2        # unigrams + bigrams

    # Scoring weights
    CONTENT_WEIGHT: float   = 0.70     # cosine similarity contribution
    PREF_WEIGHT: float      = 0.30     # explicit preference boost contribution

    # Minimum similarity to include in results
    MIN_SIMILARITY: float   = 0.01


settings = Settings()
