from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from app.services.semantic_search import (
    search_legal_sections,
    get_law_detail_by_id
)

router = APIRouter()


class SuggestRequest(BaseModel):
    text: str
    category: str | None = None
    limit: int = 5


@router.post("/suggest")
def suggest(request: SuggestRequest):
    suggestions = search_legal_sections(
        text=request.text,
        category=request.category,
        limit=request.limit
    )

    return {
        "query": request.text,
        "category": request.category,
        "suggestions": suggestions
    }


@router.get("/detail/{law_id}")
def get_law_detail(law_id: int):
    detail = get_law_detail_by_id(law_id)

    if detail is None:
        raise HTTPException(
            status_code=404,
            detail="No data found"
        )

    return detail