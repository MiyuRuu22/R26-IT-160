WINNING_PATTERNS = {
    "self-defense": "Emphasize lack of prior intent and immediate threat to life. Gather character witnesses and prior incident reports.",
    "force majeure": "Highlight unforeseeable circumstances beyond control. Review specific contract clauses and weather/event data.",
    "lack of prior intent": "Focus on state of mind during the incident. Subpoena communication records.",
    "negligence": "Establish duty of care, breach of duty, and causation. Collect maintenance logs and video footage."
}

def get_strategy_for_arguments(arguments: list) -> str:
    """Returns a defense strategy based on matching argument patterns."""
    for arg in arguments:
        for key, strategy in WINNING_PATTERNS.items():
            if key.lower() in arg.lower():
                return strategy
    return "Analyze case specifics thoroughly. Consider alternative dispute resolution if applicable."
