from fastapi import APIRouter
from app.services.search_service import get_client_cases_by_key
from app.services.risk_service import calculate_risk
from app.services.report_service import generate_summary, generate_recommendation

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/client-summary")
def client_summary(client_key: str):
    cases = get_client_cases_by_key(client_key)

    if not cases:
        return {
            "client_name": "Unknown Client",
            "summary": "No cases found for the selected client.",
            "recommendation": "Please verify the selected client and search again.",
            "risk": {
                "overall_risk": "Low",
                "confidence": 0,
                "case_count": 0,
                "civil_count": 0,
                "criminal_count": 0,
                "commercial_count": 0,
                "score": 0,
            },
        }

    client_name = cases[0].get("display_name", "Unknown Client")

    risk_data = calculate_risk(cases, client_name)
    summary = generate_summary(client_name, risk_data)
    recommendation = generate_recommendation(risk_data)

    return {
        "client_name": client_name,
        "summary": summary,
        "recommendation": recommendation,
        "risk": risk_data,
    }