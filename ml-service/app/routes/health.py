"""GET /health — readiness probe used by Node server before calling /recommend."""
from fastapi import APIRouter

router = APIRouter()
engine_ref = None  # Set by main.py


@router.get("/health")
def health():
    from app.routes import recommend
    e = recommend.engine
    return {
        "status": "ok" if e is not None else "starting",
        "corpus_size": e.corpus_size if e else 0,
        "ready": e is not None,
    }
