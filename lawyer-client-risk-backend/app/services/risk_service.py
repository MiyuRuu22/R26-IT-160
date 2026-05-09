def calculate_risk(cases: list, selected_client_name: str):
    case_count = len(cases)

    civil_count = sum(
        1 for c in cases
        if c.get("type") == "Civil"
    )

    criminal_count = sum(
        1 for c in cases
        if c.get("type") == "Criminal"
    )

    commercial_count = sum(
        1 for c in cases
        if c.get("type") == "Commercial"
    )

    # severity estimation
    severity_scores = []

    # conflict estimation
    conflict_count = 0

    # recent activity estimation
    recent_case_count = 0

    for case in cases:

        description = (
            str(case.get("description", ""))
            .lower()
        )

        # -------- SEVERITY --------

        severity = 1

        high_severity_keywords = [
            "murder",
            "fraud",
            "robbery",
            "assault",
            "criminal",
            "conviction",
            "offence",
        ]

        medium_severity_keywords = [
            "commercial",
            "contract",
            "dispute",
            "violation",
            "claim",
            "appeal",
        ]

        if any(
            word in description
            for word in high_severity_keywords
        ):
            severity = 5

        elif any(
            word in description
            for word in medium_severity_keywords
        ):
            severity = 3

        severity_scores.append(severity)

        # -------- CONFLICT --------

        conflict_keywords = [
            "dispute",
            "breach",
            "violation",
            "conflict",
            "damages",
            "injunction",
        ]

        if any(
            word in description
            for word in conflict_keywords
        ):
            conflict_count += 1

        # -------- RECENT CASES --------

        date_str = str(case.get("date_str", ""))

        if (
            "2022" in date_str
            or "2023" in date_str
            or "2024" in date_str
            or "2025" in date_str
        ):
            recent_case_count += 1

    max_severity = (
        max(severity_scores)
        if severity_scores
        else 1
    )

    avg_severity = (
        sum(severity_scores) / len(severity_scores)
        if severity_scores
        else 1
    )

    # -------- FINAL SCORE --------

    score = 0

    score += min(case_count * 6, 30)

    score += criminal_count * 12

    score += commercial_count * 6

    score += civil_count * 3

    score += conflict_count * 5

    score += int(avg_severity * 4)

    score += recent_case_count * 2

    score = min(score, 100)

    # -------- RISK LEVEL --------

    if score >= 70:
        overall_risk = "High"

    elif score >= 40:
        overall_risk = "Medium"

    else:
        overall_risk = "Low"

    # -------- CONFIDENCE --------

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