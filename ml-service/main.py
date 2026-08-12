"""
CineMatch ML Service
====================
FastAPI application serving TF-IDF content-based recommendations.

Startup sequence:
  1. Connect to MongoDB
  2. Load all media documents (featureText + metadata)
  3. Fit TF-IDF vectorizer → build sparse matrix
  4. Serve /recommend and /similar endpoints

The TF-IDF matrix is built once at startup and held in RAM.
Typical size: 23k docs × 50k terms ≈ ~500 MB sparse (negligible dense).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import connect_db, disconnect_db
from app.recommender.engine import RecommendationEngine
from app.routes import recommend, similar, health

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Shared engine instance (loaded once at startup)
engine: RecommendationEngine | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle manager."""
    global engine

    logger.info("=== CineMatch ML Service Starting ===")

    # 1. Connect to MongoDB
    await connect_db()
    logger.info("MongoDB connected.")

    # 2. Build TF-IDF engine
    logger.info("Building TF-IDF recommendation engine...")
    engine = RecommendationEngine()
    await engine.build()
    logger.info(f"Engine ready. Corpus size: {engine.corpus_size:,} documents.")

    # Inject engine into route modules
    recommend.engine = engine
    similar.engine   = engine

    yield  # App runs here

    # Shutdown
    await disconnect_db()
    logger.info("=== CineMatch ML Service Stopped ===")


app = FastAPI(
    title="CineMatch ML Service",
    description="TF-IDF content-based recommendation engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(recommend.router)
app.include_router(similar.router)
