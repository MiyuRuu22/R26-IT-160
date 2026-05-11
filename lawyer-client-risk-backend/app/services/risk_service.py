def criminal_risk_score(criminal_count: int) -> int:
    if criminal_count >= 5:
        return 100
    if criminal_count == 4:
        return 85
    if criminal_count == 3:
        return 75
    if criminal_count == 2:
        return 65
    if criminal_count == 1:
        return 50
    return 0


def calculate_risk(cases: list, selected_client_name: str):
    case_count = len(cases)

    civil_count = sum(1 for c in cases if c.get("type") == "Civil")
    criminal_count = sum(1 for c in cases if c.get("type") == "Criminal")
    commercial_count = sum(1 for c in cases if c.get("type") == "Commercial")

    severity_scores = []
    conflict_count = 0
    recent_case_count = 0

    for case in cases:
        description = str(case.get("description", "")).lower()

        severity = 1

        high_severity_keywords = [
            "murder",
            "fraud",
            "robbery",
            "assault",
            "criminal",
            "conviction",
            "offence",
            "imprisonment",
            "rape",
            "bribery",
            "sentence",
        ]

        medium_severity_keywords = [
            "commercial",
            "contract",
            "dispute",
            "violation",
            "claim",
            "appeal",
            "penalty",
            "damages",
            "breach",
            "injunction",
        ]

        if any(word in description for word in high_severity_keywords):
            severity = 5
        elif any(word in description for word in medium_severity_keywords):
            severity = 3

        severity_scores.append(severity)

        conflict_keywords = [
            "dispute",
            "breach",
            "violation",
            "conflict",
            "damages",
            "injunction",
            "claim",
        ]

        if any(word in description for word in conflict_keywords):
            conflict_count += 1

        date_str = str(
            case.get("date", "")
            or case.get("date_str", "")
            or ""
        )

        if any(year in date_str for year in ["2021", "2022", "2023", "2024", "2025", "2026"]):
            recent_case_count += 1

    max_severity = max(severity_scores) if severity_scores else 1
    avg_severity = sum(severity_scores) / len(severity_scores) if severity_scores else 1

    # Criminal cases get strong minimum risk score
    score = criminal_risk_score(criminal_count)

    # Extra factors increase the score further
    score += min(case_count * 3, 15)
    score += min(civil_count * 3, 12)
    score += min(commercial_count * 6, 18)
    score += conflict_count * 5
    score += int(avg_severity * 4)
    score += recent_case_count * 2

    score = min(score, 100)

    if score >= 70:
        overall_risk = "High"
    elif score >= 40:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"

    if overall_risk == "High":
        confidence = 0.88
    elif overall_risk == "Medium":
        confidence = 0.82
    else:
        confidence = 0.76

    return {
        "overall_risk": overall_risk,
        "confidence": confidence,
        "case_count": case_count,
        "civil_count": civil_count,
        "criminal_count": criminal_count,
        "commercial_count": commercial_count,
        "conflict_count": conflict_count,
        "recent_case_count": recent_case_count,
        "max_severity": max_severity,
        "avg_severity": round(avg_severity, 2),
        "score": score,
    }