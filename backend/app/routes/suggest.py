from fastapi import APIRouter
from pydantic import BaseModel

from app.services.nlp_service import get_embedding
from app.services.judgement_search import search_judgements
from app.services.search_service import search_legal_content
from app.services.smart_filter import (
    is_valid_input,
    detect_category_mismatch,
    filter_and_rank_results,
)

router = APIRouter()


class SuggestRequest(BaseModel):
    text: str
    category: str


@router.post("/suggest")
def suggest(req: SuggestRequest):

    sentence = req.text.strip()
    category = req.category.strip()

    # 🔥 VALIDATE INPUT
    if not is_valid_input(sentence):
        return {
            "suggestions": [],
            "case_suggestions": []
        }

    # 🔥 CATEGORY CHECK
    if detect_category_mismatch(sentence, category):
        return {
            "suggestions": [],
            "case_suggestions": []
        }

    # 🔥 CREATE EMBEDDING
    query_embedding = get_embedding(sentence)

    # 🔥 ACT SEARCH
    raw_results = search_legal_content(
        query_embedding,
        category,
        top_k=10
    )

    final_results = filter_and_rank_results(
        sentence,
        raw_results
    )

    # 🔥 JUDGEMENT SEARCH
    case_results = search_judgements(
        sentence,
        top_k=5
    )

    return {
        "suggestions": final_results,
        "case_suggestions": case_results
    }