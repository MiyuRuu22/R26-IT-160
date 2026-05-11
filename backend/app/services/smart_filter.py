import re


# 🔹 MIN WORD CHECK
def is_valid_input(sentence: str) -> bool:
    words = sentence.split()

    if len(words) >= 5:
        return True

    if len(words) >= 4 and re.search(r"[.,]$", sentence):
        return True

    return False


# 🔹 SIMPLE MEANING CHECK
def has_meaning(sentence: str) -> bool:
    words = sentence.lower().split()

    stop_words = {"the", "is", "and", "or", "a", "to", "of", "in"}

    meaningful = [w for w in words if w not in stop_words]

    return len(meaningful) >= 2


# 🔹 CATEGORY DETECTOR
def detect_sentence_category(sentence: str):
    s = sentence.lower()

    if any(w in s for w in ["accused", "murder", "offence", "crime", "bail"]):
        return "criminal"

    if any(w in s for w in ["tax", "company", "revenue", "payment"]):
        return "civil"

    if any(w in s for w in ["agreement", "contract", "breach"]):
        return "contract"

    if any(w in s for w in ["land", "property", "lease"]):
        return "property"

    if any(w in s for w in ["marriage", "divorce", "child"]):
        return "family"

    return None


# 🔹 CATEGORY MISMATCH
def detect_category_mismatch(sentence: str, selected_category: str):
    detected = detect_sentence_category(sentence)

    if detected and detected != selected_category:
        return True

    return False


# 🔹 FINAL FILTER + RANK
def filter_and_rank_results(sentence: str, results: list):
    if not results:
        return []

    # 🔥 SCORE THRESHOLD
    strong_results = [r for r in results if r["score"] > 0.55]

    if not strong_results:
        return []

    # 🔥 KEYWORD BOOST
    sentence_lower = sentence.lower()

    for r in strong_results:
        boost = 0

        if "tax" in sentence_lower and "revenue" in r["title"].lower():
            boost += 0.1

        if "accused" in sentence_lower and "criminal" in r["category"]:
            boost += 0.1

        r["final_score"] = r["score"] + boost

    # 🔥 SORT
    sorted_results = sorted(
        strong_results,
        key=lambda x: x["final_score"],
        reverse=True
    )

    # 🔥 RETURN BEST 5
    return sorted_results[:5]