"""
legal_classifier.py
===================
Keyword-weighted Legal Issue Classifier for Sri Lankan law.

Classifies a free-text legal query into a fine-grained issue category
(e.g. "drug_offense") and maps it to the broad CSV categories used
by the FAISS index (e.g. ["criminal", "evidence_procedure"]).

Architecture
------------
This module is intentionally self-contained so it can later be swapped
for a Gemini / OpenAI LLM classifier without changing api_search.py.
All external callers use one function: classify_legal_issue(text).

Usage
-----
    from legal_classifier import classify_legal_issue

    result = classify_legal_issue("alleged drug trafficking criminal conspiracy")
    # {
    #   "issue":              "drug_offense",
    #   "issue_label":        "Drug Offense",
    #   "confidence":         0.91,
    #   "allowed_categories": ["criminal", "evidence_procedure"],
    #   "matched_keywords":   ["drug", "trafficking", "criminal"],
    #   "fallback":           False
    # }

Extending
---------
- To add a new issue category: add an entry to LEGAL_ISSUE_TAXONOMY.
- To upgrade to LLM classification: implement a new classify function
  matching the same return schema and swap the call in classify_legal_issue().
"""

from __future__ import annotations

import re
import logging
from typing import TypedDict

logger = logging.getLogger("legal_classifier")


# ══════════════════════════════════════════════════════════════════════════════
# TAXONOMY
# ══════════════════════════════════════════════════════════════════════════════

class IssueDefinition(TypedDict):
    label: str                      # Human-readable label shown in UI
    keywords: dict[str, int]        # keyword → weight (1=weak, 2=medium, 3=strong)
    allowed_categories: list[str]   # Broad CSV categories to search within
    exclude_keywords: list[str]     # Words that, if present, reduce this score


# The taxonomy maps fine-grained legal issue → detection configuration.
# CSV categories available: criminal, commercial, civil, tax, labour,
#   public_law, evidence_procedure, immigration, education,
#   environment, agriculture, unknown
LEGAL_ISSUE_TAXONOMY: dict[str, IssueDefinition] = {

    "drug_offense": {
        "label": "Drug Offense",
        "keywords": {
            # Substance names — very high specificity (weight 3)
            "heroin": 3, "cocaine": 3, "methamphetamine": 3, "cannabis": 3,
            "ganja": 3, "opium": 3, "morphine": 3, "ice": 2,
            "narcotics": 3, "psychotropic": 3, "controlled substance": 3,
            # Acts and context
            "dangerous drug": 3, "dangerous drugs ordinance": 3,
            "drug trafficking": 3, "drug dealer": 3, "drug possession": 3,
            # General drug words (weight 2)
            "narcotic": 2, "illicit drug": 2, "drug abuse": 2,
            "substance abuse": 2, "drug offence": 2,
            # Weaker signals (weight 1)
            "drug": 1, "trafficking": 1, "possession": 1,
        },
        "allowed_categories": ["criminal", "evidence_procedure"],
        "exclude_keywords": ["human trafficking", "child trafficking", "sex trafficking",
                             "trafficking in persons", "trafficking in women"],
    },

    "financial_fraud": {
        "label": "Financial Fraud",
        "keywords": {
            # Specific fraud types
            "money laundering": 3, "cheque fraud": 3, "bank fraud": 3,
            "ponzi": 3, "embezzlement": 3, "misappropriation": 3,
            "financial crime": 3, "fraudulent transfer": 3,
            "insider trading": 3, "market manipulation": 3,
            # Acts
            "financial transactions reporting": 3, "anti-money laundering": 3,
            # Medium signals
            "fraud": 2, "financial fraud": 2, "forgery": 2,
            "forged document": 2, "counterfeit": 2,
            "criminal breach of trust": 2, "misrepresentation": 2,
            "false accounting": 2, "bank transaction": 2,
            # Weaker
            "financial": 1, "banking": 1, "transaction": 1, "account": 1,
        },
        "allowed_categories": ["criminal", "commercial", "tax", "evidence_procedure"],
        "exclude_keywords": ["traffic", "drug"],
    },

    "murder": {
        "label": "Homicide / Murder",
        "keywords": {
            "murder": 3, "culpable homicide": 3, "manslaughter": 3,
            "killing": 3, "death": 2, "homicide": 3,
            "grievous hurt": 2, "bodily harm resulting in death": 3,
            "fatal": 2, "cause of death": 2,
            "penal code 296": 3, "penal code 297": 3,
        },
        "allowed_categories": ["criminal", "evidence_procedure"],
        "exclude_keywords": [],
    },

    "cybercrime": {
        "label": "Cybercrime",
        "keywords": {
            "cybercrime": 3, "hacking": 3, "computer fraud": 3,
            "unauthorized access": 3, "data breach": 3,
            "identity theft": 3, "phishing": 3, "ransomware": 3,
            "malware": 3, "online fraud": 3, "electronic crime": 3,
            "computer crime": 3, "cyber offence": 3,
            "information technology": 2, "internet fraud": 2,
            "digital evidence": 2, "electronic evidence": 2,
            "social media": 1, "online": 1, "digital": 1, "cyber": 2,
        },
        "allowed_categories": ["criminal", "commercial", "evidence_procedure"],
        "exclude_keywords": [],
    },

    "human_trafficking": {
        "label": "Human Trafficking",
        "keywords": {
            "human trafficking": 3, "trafficking in persons": 3,
            "trafficking in women": 3, "trafficking in children": 3,
            "child trafficking": 3, "sex trafficking": 3,
            "forced labour": 3, "bonded labour": 3, "debt bondage": 3,
            "sexual exploitation": 3, "prostitution": 2,
            "trafficking convention": 3, "victim of trafficking": 3,
            "smuggling of migrants": 2,
        },
        "allowed_categories": ["criminal", "immigration", "evidence_procedure"],
        "exclude_keywords": ["drug trafficking", "narcotics trafficking"],
    },

    "domestic_violence": {
        "label": "Domestic Violence",
        "keywords": {
            "domestic violence": 3, "spousal abuse": 3, "marital violence": 3,
            "prevention of domestic violence": 3,
            "protection order": 3, "restraining order": 2,
            "family violence": 3, "intimate partner violence": 3,
            "abuse of spouse": 3, "child abuse": 2,
            "assault on spouse": 3, "cruelty": 2,
        },
        "allowed_categories": ["criminal", "civil", "evidence_procedure"],
        "exclude_keywords": [],
    },

    "corruption": {
        "label": "Corruption / Bribery",
        "keywords": {
            "bribery": 3, "corruption": 3, "gratification": 3,
            "bribe": 3, "kickback": 3, "graft": 3,
            "public official": 2, "abuse of power": 2,
            "conflict of interest": 2, "illicit enrichment": 3,
            "misuse of public funds": 3, "commission to investigate bribery": 3,
            "bribery act": 3, "election bribery": 2,
        },
        "allowed_categories": ["criminal", "public_law", "evidence_procedure"],
        "exclude_keywords": [],
    },

    "theft": {
        "label": "Theft / Robbery",
        "keywords": {
            "theft": 3, "robbery": 3, "burglary": 3,
            "larceny": 3, "shoplifting": 3, "extortion": 3,
            "receiving stolen property": 3, "handle stolen goods": 3,
            "breaking and entering": 3, "pickpocketing": 2,
            "snatching": 2, "stolen": 2,
        },
        "allowed_categories": ["criminal", "evidence_procedure"],
        "exclude_keywords": [],
    },

    "assault": {
        "label": "Assault / Grievous Hurt",
        "keywords": {
            "assault": 3, "battery": 3, "grievous hurt": 3,
            "bodily harm": 3, "wounding": 3, "causing hurt": 3,
            "physical injury": 2, "attacked": 2, "stabbing": 3,
            "shooting": 2, "armed attack": 2,
        },
        "allowed_categories": ["criminal", "evidence_procedure"],
        "exclude_keywords": [],
    },

    "terrorism": {
        "label": "Terrorism",
        "keywords": {
            "terrorism": 3, "terrorist": 3, "prevention of terrorism": 3,
            "terrorist financing": 3, "terrorist bombing": 3,
            "suppression of terrorism": 3, "extremist": 2,
            "radicalization": 2, "bomb": 2, "explosive": 2,
            "armed group": 2, "militant": 2,
        },
        "allowed_categories": ["criminal", "public_law", "evidence_procedure"],
        "exclude_keywords": [],
    },

    "civil_dispute": {
        "label": "Civil Dispute",
        "keywords": {
            "breach of contract": 3, "contract dispute": 3, "negligence": 3,
            "tort": 3, "defamation": 3, "nuisance": 3,
            "property dispute": 3, "adverse possession": 3,
            "trespass": 3, "injunction": 2, "civil suit": 2,
            "damages": 2, "compensation": 1, "plaintiff": 2,
        },
        "allowed_categories": ["civil", "commercial", "evidence_procedure"],
        "exclude_keywords": [],
    },

    "labour_dispute": {
        "label": "Labour / Employment",
        "keywords": {
            "wrongful termination": 3, "unfair dismissal": 3,
            "employment dispute": 3, "labour dispute": 3,
            "industrial dispute": 3, "trade union": 3,
            "wages": 2, "gratuity": 2, "salary arrears": 2,
            "work injury": 2, "occupational safety": 2,
            "termination of employment": 3, "EPF": 2, "ETF": 2,
        },
        "allowed_categories": ["labour", "civil", "evidence_procedure"],
        "exclude_keywords": [],
    },
}

# Minimum confidence to apply category filtering.
# Below this threshold, search the full corpus (safety net).
CONFIDENCE_THRESHOLD = 0.20


# ══════════════════════════════════════════════════════════════════════════════
# CLASSIFIER
# ══════════════════════════════════════════════════════════════════════════════

class ClassificationResult(TypedDict):
    issue: str
    issue_label: str
    confidence: float
    allowed_categories: list[str]
    matched_keywords: list[str]
    fallback: bool


def _normalise(text: str) -> str:
    """Lowercase, collapse whitespace, remove punctuation except hyphens."""
    text = text.lower()
    text = re.sub(r"[^\w\s\-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _score_issue(norm_text: str, defn: IssueDefinition) -> tuple[float, list[str]]:
    """
    Score how strongly norm_text matches an issue definition.
    Returns (raw_score, matched_keywords).

    raw_score is the sum of weights for all matched keywords, minus a penalty
    for each matched exclude_keyword (penalty = max keyword weight for that issue).
    """
    matched: list[str] = []
    score = 0.0
    max_weight = max(defn["keywords"].values()) if defn["keywords"] else 1

    for keyword, weight in defn["keywords"].items():
        if keyword in norm_text:
            matched.append(keyword)
            score += weight

    # Apply exclusion penalty: each excluded keyword costs max_weight points
    for excl in defn["exclude_keywords"]:
        if excl in norm_text:
            score -= max_weight * 2          # strong penalty

    return max(score, 0.0), matched


def classify_legal_issue(text: str) -> ClassificationResult:
    """
    Classify a legal query into a fine-grained issue category.

    Parameters
    ----------
    text : str
        Raw user query or legal issue description.

    Returns
    -------
    ClassificationResult dict with keys:
        issue              - snake_case category identifier
        issue_label        - Human-readable label
        confidence         - 0.0–1.0 score
        allowed_categories - List of CSV category values to filter by
        matched_keywords   - Keywords that fired during classification
        fallback           - True if no confident match found
    """
    norm = _normalise(text)
    logger.info(f"[classifier] Classifying: '{text[:100]}'")

    scores: dict[str, tuple[float, list[str]]] = {}
    for issue, defn in LEGAL_ISSUE_TAXONOMY.items():
        raw, matched = _score_issue(norm, defn)
        scores[issue] = (raw, matched)

    # Find the best-scoring issue
    best_issue = max(scores, key=lambda k: scores[k][0])
    best_raw, best_matched = scores[best_issue]

    # Compute total score across all issues for normalisation
    total_raw = sum(s for s, _ in scores.values())

    if total_raw == 0 or best_raw == 0:
        # No keywords matched at all — return fallback
        logger.info("[classifier] No keywords matched. Returning fallback.")
        return _fallback_result(text)

    # Confidence = proportion of total score captured by the best issue
    confidence = round(best_raw / total_raw, 4)

    # Also cap confidence by the best issue's theoretical max
    defn = LEGAL_ISSUE_TAXONOMY[best_issue]
    max_possible = sum(defn["keywords"].values())
    if max_possible > 0:
        intrinsic_conf = min(best_raw / max_possible, 1.0)
        # Blend both measures, weighted toward intrinsic confidence
        confidence = round((confidence * 0.4 + intrinsic_conf * 0.6), 4)

    if confidence < CONFIDENCE_THRESHOLD:
        logger.info(f"[classifier] Confidence {confidence:.3f} below threshold. Fallback.")
        return _fallback_result(text)

    logger.info(
        f"[classifier] → {best_issue} (conf={confidence:.3f}) "
        f"matched={best_matched}"
    )

    return ClassificationResult(
        issue=best_issue,
        issue_label=defn["label"],
        confidence=min(confidence, 1.0),
        allowed_categories=defn["allowed_categories"],
        matched_keywords=best_matched,
        fallback=False,
    )


def _fallback_result(text: str) -> ClassificationResult:
    """
    Fallback when no confident classification is possible.
    Expands search to broad criminal + civil + commercial categories.
    Intentionally excludes 'unknown' to prevent unrelated laws from surfacing.
    """
    return ClassificationResult(
        issue="general",
        issue_label="General Legal Matter",
        confidence=0.0,
        allowed_categories=["criminal", "civil", "commercial", "evidence_procedure",
                            "public_law", "labour", "tax"],
        matched_keywords=[],
        fallback=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
# CLI — quick test
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import json
    test_queries = [
        "Alleged drug trafficking and criminal conspiracy",
        "Money laundering and bank fraud",
        "Wrongful termination and EPF arrears",
        "Human trafficking and sexual exploitation",
        "Domestic violence protection order",
        "Contract breach and damages for negligence",
        "Hacking into computer systems unauthorized access",
        "Bribery of public official",
        "Armed robbery and theft",
        "Terrorism charges under prevention of terrorism act",
        "Assault causing grievous bodily harm",
        "General legal matter",
    ]
    for q in test_queries:
        result = classify_legal_issue(q)
        print(f"\nQuery : {q}")
        print(f"Issue : {result['issue_label']} ({result['issue']})")
        print(f"Conf  : {result['confidence']:.2%}")
        print(f"Cats  : {result['allowed_categories']}")
        print(f"Keys  : {result['matched_keywords']}")
        print(f"Fallbk: {result['fallback']}")
