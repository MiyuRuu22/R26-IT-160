from fastapi import APIRouter
from app.services.search_service import get_client_cases_by_key
from app.services.risk_service import calculate_risk
from app.services.report_service import generate_summary

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/profile")
def get_client_profile(client_key: str):
    cases = get_client_cases_by_key(client_key)

    if not cases:
        return {
            "client_key": client_key,
            "client_name": "Unknown Client",
            "court_location": "Unknown",
            "overall_risk": "Low",
            "confidence": 0,
            "case_count": 0,
            "civil_count": 0,
            "criminal_count": 0,
            "commercial_count": 0,
            "score": 0,
            "summary": "No cases found for the selected client.",
            "cases": [],
        }

    client_name = cases[0].get("display_name", "Unknown Client")
    court_location = cases[0].get("court_location", "Unknown")

    risk_data = calculate_risk(cases, client_name)
    summary = generate_summary(client_name, risk_data, cases)

    formatted_cases = []
    for c in cases:
        formatted_cases.append(
            {
                "id": c["id"],
                "title": c["title"],
                "type": c["type"],
                "date": c["date"],
                "risk_tag": risk_data["overall_risk"],
                "pdf_url": c["pdf_url"] if c["pdf_url"] else "",
                "pdf_available": True if c["pdf_url"] else False,
            }
        )

    return {
        "client_key": client_key,
        "client_name": client_name,
        "court_location": court_location,
        "overall_risk": risk_data["overall_risk"],
        "confidence": risk_data["confidence"],
        "case_count": risk_data["case_count"],
        "civil_count": risk_data["civil_count"],
        "criminal_count": risk_data["criminal_count"],
        "commercial_count": risk_data["commercial_count"],
        "score": risk_data["score"],
        "summary": summary,
        "cases": formatted_cases,
    }