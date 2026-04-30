def calculate_risk(cases: list, selected_client_name: str):
    case_count = len(cases)
    civil_count = sum(1 for c in cases if c["type"] == "Civil")
    criminal_count = sum(1 for c in cases if c["type"] == "Criminal")
    commercial_count = sum(1 for c in cases if c["type"] == "Commercial")

    score = 0
    score += min(case_count * 10, 40)
    score += criminal_count * 15
    score += commercial_count * 8
    score += civil_count * 5

    score = min(score, 100)

    if score >= 70:
        overall_risk = "High"
    elif score >= 40:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"

    confidence = 0.85 if overall_risk == "High" else 0.8 if overall_risk == "Medium" else 0.75

    return {
        "overall_risk": overall_risk,
        "confidence": confidence,
        "case_count": case_count,
        "civil_count": civil_count,
        "criminal_count": criminal_count,
        "commercial_count": commercial_count,
        "score": score,
    }