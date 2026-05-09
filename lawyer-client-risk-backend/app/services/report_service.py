def generate_recommendation(risk_data: dict):
    risk = risk_data["overall_risk"]

    if risk == "High":
        return (
            "Careful review required before accepting this client. "
            "Review past case history, severity, and repeated legal patterns."
        )

    if risk == "Medium":
        return (
            "Proceed with caution. Review the client’s past case "
            "categories and recent legal activity."
        )

    return (
        "Low immediate concern. Still review available "
        "case records before final acceptance."
    )


def detect_keywords(cases):
    criminal_keywords = [
        "criminal",
        "offence",
        "accused",
        "conviction",
        "sentence",
        "assault",
        "fraud",
        "murder",
        "robbery",
        "theft",
        "bail",
    ]

    commercial_keywords = [
        "contract",
        "company",
        "bank",
        "insurance",
        "commercial",
        "business",
        "payment",
        "loan",
        "agreement",
        "debt",
    ]

    civil_keywords = [
        "land",
        "property",
        "partition",
        "marriage",
        "divorce",
        "custody",
        "inheritance",
        "fundamental rights",
    ]

    conflict_keywords = [
        "dispute",
        "breach",
        "violation",
        "appeal",
        "petition",
        "damages",
        "injunction",
        "claim",
    ]

    text = " ".join(
        [
            f"{case.get('description', '')} "
            f"{case.get('parties', '')} "
            f"{case.get('title', '')}"
            for case in cases
        ]
    ).lower()

    found = {
        "criminal": [w for w in criminal_keywords if w in text],
        "commercial": [w for w in commercial_keywords if w in text],
        "civil": [w for w in civil_keywords if w in text],
        "conflict": [w for w in conflict_keywords if w in text],
    }

    return found


def generate_summary(
    client_name: str,
    risk_data: dict,
    cases=None,
):
    cases = cases or []

    recommendation = generate_recommendation(risk_data)

    keywords = detect_keywords(cases)

    reasons = []

    if risk_data["criminal_count"] > 0:
        reasons.append(
            f"{risk_data['criminal_count']} criminal-related case(s)"
        )

    if risk_data["commercial_count"] > 0:
        reasons.append(
            f"{risk_data['commercial_count']} commercial dispute-related case(s)"
        )

    if risk_data["civil_count"] > 0:
        reasons.append(
            f"{risk_data['civil_count']} civil legal case(s)"
        )

    if keywords["criminal"]:
        reasons.append(
            "criminal keywords detected such as "
            + ", ".join(keywords["criminal"][:3])
        )

    if keywords["commercial"]:
        reasons.append(
            "commercial keywords detected such as "
            + ", ".join(keywords["commercial"][:3])
        )

    if keywords["conflict"]:
        reasons.append(
            "conflict-related terms detected such as "
            + ", ".join(keywords["conflict"][:3])
        )

    if not reasons:
        reasons.append(
            "no major high-risk legal patterns were detected"
        )

    reason_text = "; ".join(reasons)

    return (
        f"Client {client_name} has "
        f"{risk_data['case_count']} identified past case(s). "
        f"The system predicted the overall risk level as "
        f"{risk_data['overall_risk']} Risk because "
        f"{reason_text}. "
        f"Recommendation: {recommendation}"
    )