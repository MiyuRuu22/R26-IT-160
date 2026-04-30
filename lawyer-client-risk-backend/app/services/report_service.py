def generate_recommendation(risk_data: dict):
    risk = risk_data["overall_risk"]

    if risk == "High":
        return "Careful review required before accepting this client. Review past case history, severity, and repeated legal patterns."
    if risk == "Medium":
        return "Proceed with caution. Review the client’s past case categories and recent legal activity."
    return "Low immediate concern. Still review available case records before final acceptance."


def generate_summary(client_name: str, risk_data: dict):
    recommendation = generate_recommendation(risk_data)

    return (
        f"Client {client_name} has {risk_data['case_count']} identified past cases. "
        f"Civil cases: {risk_data['civil_count']}, "
        f"criminal cases: {risk_data['criminal_count']}, "
        f"commercial cases: {risk_data['commercial_count']}. "
        f"Predicted overall risk level is {risk_data['overall_risk']}. "
        f"Recommendation: {recommendation}"
    )