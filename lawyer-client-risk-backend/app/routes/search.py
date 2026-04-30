from fastapi import APIRouter
from pydantic import BaseModel
from app.services.search_service import search_matching_clients

router = APIRouter(prefix="/search", tags=["Search"])


class SearchRequest(BaseModel):
    full_name: str
    court_location: str = ""
    case_type_hint: str = ""


@router.post("/clients")
def search_clients(payload: SearchRequest):
    results = search_matching_clients(
        full_name=payload.full_name,
        court_location=payload.court_location,
        case_type_hint=payload.case_type_hint,
    )

    return {"matches": results}