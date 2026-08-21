from .winning_patterns import get_strategy_for_arguments

def generate_recommendations(matched_case: dict, similarity_score: float) -> dict:
    """Generates explainable reasons and recommendations based on a matched case."""
    
    # Generate explainable reasons
    reasons = []
    if similarity_score > 80:
        reasons.append("Highly similar contextual summary.")
    if "case_type" in matched_case:
        reasons.append(f"Matching legal domain: {matched_case['case_type']}.")
    
    # Get defense strategy
    arguments = matched_case.get("arguments", [])
    strategy = get_strategy_for_arguments(arguments)
    
    return {
        "reasons": reasons,
        "strategy": strategy
    }
