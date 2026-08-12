"""GET /similar/{media_id} — content-based similar titles."""
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()
engine = None  # Injected by main.py at startup


@router.get("/similar/{media_id}")
def get_similar(media_id: str, limit: int = Query(default=12, ge=1, le=50)):
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not ready yet.")

    if media_id not in engine.id_to_idx:
        raise HTTPException(status_code=404, detail="Media not found in corpus.")

    similar_items = engine.similar(media_id=media_id, limit=limit)

    return {
        "similar":  similar_items,
        "basedOn":  media_id,
        "source":   "ml-service",
    }
