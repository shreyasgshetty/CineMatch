"""Configuration for CineMatch ML service."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load server/.env locally if it exists.
# On Render, environment variables are provided directly by Render.
_env_path = Path(__file__).resolve().parents[3] / "server" / ".env"

if _env_path.exists():
    load_dotenv(_env_path)


class Settings:
    MONGO_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb://localhost:27017/test"
    )

    DB_NAME: str = os.getenv(
        "DB_NAME",
        "test"
    )

    PORT: int = int(os.getenv("ML_PORT", "8000"))
    HOST: str = os.getenv("ML_HOST", "0.0.0.0")

    # TF-IDF params
    TFIDF_MAX_FEATURES: int = 60_000
    TFIDF_MIN_DF: int = 2
    TFIDF_NGRAM_MAX: int = 2

    # Scoring weights
    CONTENT_WEIGHT: float = 0.70
    PREF_WEIGHT: float = 0.30

    MIN_SIMILARITY: float = 0.01


settings = Settings()