def infer_severity(text: str) -> int:
    t = str(text).lower()

    if any(word in t for word in ["murder", "fraud", "conviction", "imprisonment", "rape", "bribery"]):
        return 3
    if any(word in t for word in ["penalty", "damages", "violation", "dismissed", "appeal dismissed"]):
        return 2
    return 1


def build_case_features(cases: list, selected_name: str) -> dict:
    case_count = len(cases)
    civil_count = sum(1 for c in cases if c["type"] == "Civil")
    criminal_count = sum(1 for c in cases if c["type"] == "Criminal")
    commercial_count = sum(1 for c in cases if c["type"] == "Commercial")

    severities = [infer_severity(c.get("description", "")) for c in cases]
    max_severity = max(severities) if severities else 0
    avg_severity = sum(severities) / len(severities) if severities else 0

    conflict_count = 0
    selected_n = str(selected_name).lower().strip()
    for c in cases:
        if selected_n and selected_n in str(c.get("parties", "")).lower():
            conflict_count += 1

    recent_case_count = 0
    for c in cases:
        date_str = str(c.get("date", "") or "")
        if any(y in date_str for y in ["2021", "2022", "2023", "2024", "2025", "2026"]):
            recent_case_count += 1

    return {
        "case_count": case_count,
        "civil_count": civil_count,
        "criminal_count": criminal_count,
        "commercial_count": commercial_count,
        "max_severity": max_severity,
        "avg_severity": avg_severity,
        "conflict_count": conflict_count,
        "recent_case_count": recent_case_count,
    }


def assign_training_label(feature_row: dict) -> str:
    score = 0
    score += min(feature_row["case_count"] * 8, 30)
    score += feature_row["criminal_count"] * 15
    score += feature_row["commercial_count"] * 8
    score += feature_row["civil_count"] * 4
    score += feature_row["max_severity"] * 10
    score += int(feature_row["avg_severity"] * 8)
    score += feature_row["conflict_count"] * 8
    score += feature_row["recent_case_count"] * 5

    if score >= 65:
        return "High"
    if score >= 35:
        return "Medium"
    return "Low"