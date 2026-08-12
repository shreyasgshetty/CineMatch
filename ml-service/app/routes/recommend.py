"""POST /recommend — personalized recommendations for a user."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
engine = None  # Injected by main.py at startup


class PreferencePayload(BaseModel):
    languages:  list[str]       = []
    genres:     dict[str, float] = {}
    actors:     dict[str, float] = {}
    directors:  dict[str, float] = {}


class RecommendRequest(BaseModel):
    userId:      str
    preferences: PreferencePayload = PreferencePayload()
    limit:       int = 20


@router.post("/recommend")
async def recommend(req: RecommendRequest):
    if engine is None:
        raise HTTPException(status_code=503, detail="Engine not ready yet.")

    limit = max(1, min(req.limit, 100))

    recommendations = await engine.recommend(
        user_id=req.userId,
        preferences={
            "languages":  req.preferences.languages,
            "genres":     req.preferences.genres,
            "actors":     req.preferences.actors,
            "directors":  req.preferences.directors,
        },
        limit=limit,
    )

    return {
        "recommendations": recommendations,
        "count": len(recommendations),
        "source": "ml-service",
    }
