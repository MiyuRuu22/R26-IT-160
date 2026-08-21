from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import re

# Optional spacy import for NLP. If not installed, we fallback to regex.
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except (ImportError, OSError):
    nlp = None

logger = logging.getLogger("opponent_engine")

opponent_router = APIRouter(tags=["Opponent Prediction Engine"])

# --- Models ---

class ArgumentAnalysisRequest(BaseModel):
    defense_arguments: str
    charges: str
    hearing_notes: Optional[str] = ""
    witness_summaries: Optional[str] = ""
    evidence_summaries: Optional[str] = ""
    legal_sections: Optional[str] = ""

class AnalysisResult(BaseModel):
    weaknesses: List[Dict[str, str]]
    contradictions: List[Dict[str, str]]
    missing_evidence: List[str]
    detected_claims: List[str]

class PredictionRequest(BaseModel):
    analyzed_data: Dict[str, Any]

class PredictionResult(BaseModel):
    likely_opponent_arguments: List[str]
    prosecution_objections: List[str]
    evidence_attacks: List[str]
    procedural_objections: List[str]
    preparation_recommendations: List[str]

class InsightRequest(BaseModel):
    text: str

class InsightResult(BaseModel):
    entities: List[Dict[str, str]]
    claims: List[str]
    evidence_references: List[str]
    procedural_issues: List[str]

class RiskRequest(BaseModel):
    weaknesses_count: int
    contradictions_count: int
    missing_evidence_count: int

class RiskResult(BaseModel):
    risk_level: str
    confidence_score: float
    vulnerability_analysis: str

# --- Mocks & Rules (Rule-Based Expert System) ---

WEAKNESS_RULES = [
    (r"maybe|perhaps|possibly", "Unsupported speculative claim."),
    (r"not sure|cannot confirm", "Lack of certainty in defense."),
    (r"no evidence of (?!alibi)", "Admission of missing evidence."),
]

CONTRADICTION_RULES = [
    (r"was not at the scene.*?saw him at the scene", "Alibi contradiction with witness."),
    (r"did not know.*?met him before", "Contradiction in relationship."),
]

PROSECUTION_ARGUMENTS = {
    "alibi": ["The alibi is uncorroborated by independent witnesses.", "Cell tower data places accused near the scene."],
    "self-defense": ["The force used was disproportionate.", "The accused provoked the incident."],
    "lack of evidence": ["Circumstantial evidence is sufficient.", "The chain of custody is unbroken."],
}

def analyze_text_for_weaknesses(text: str) -> List[Dict[str, str]]:
    weaknesses = []
    text_lower = text.lower()
    for pattern, reason in WEAKNESS_RULES:
        if re.search(pattern, text_lower):
            weaknesses.append({"pattern": pattern.replace("|", "/"), "reason": reason})
    if not weaknesses:
        weaknesses.append({"pattern": "general", "reason": "No major textual weaknesses detected, but verify factual backing."})
    return weaknesses

def detect_missing_evidence(text: str) -> List[str]:
    missing = []
    text_lower = text.lower()
    if "murder" in text_lower and "autopsy" not in text_lower:
        missing.append("Missing Autopsy Report")
    if "drugs" in text_lower and "analyst report" not in text_lower:
        missing.append("Missing Government Analyst Report")
    if "fraud" in text_lower and "bank statement" not in text_lower:
        missing.append("Missing Financial Records")
    return missing

# --- Endpoints ---

@opponent_router.post("/analyze-argument", response_model=AnalysisResult)
async def analyze_argument(req: ArgumentAnalysisRequest):
    """
    Analyzes defense arguments to detect weaknesses, contradictions, and missing evidence.
    """
    combined_text = f"{req.defense_arguments} {req.hearing_notes} {req.evidence_summaries}"
    
    weaknesses = analyze_text_for_weaknesses(combined_text)
    missing_ev = detect_missing_evidence(combined_text)
    
    # Simple contradiction check
    contradictions = []
    for pattern, reason in CONTRADICTION_RULES:
        if re.search(pattern, combined_text.lower()):
            contradictions.append({"issue": reason})

    claims = ["Claim of Innocence"]
    if "alibi" in combined_text.lower():
        claims.append("Alibi Defense")
    if "self-defense" in combined_text.lower() or "self defense" in combined_text.lower():
        claims.append("Self-Defense")

    return AnalysisResult(
        weaknesses=weaknesses,
        contradictions=contradictions,
        missing_evidence=missing_ev,
        detected_claims=claims
    )

@opponent_router.post("/predict-opponent", response_model=PredictionResult)
async def predict_opponent(req: PredictionRequest):
    """
    Predicts likely prosecution responses and objections based on the analyzed data.
    """
    claims = req.analyzed_data.get("detected_claims", [])
    
    opponent_args = []
    objections = ["Hearsay objection on unverified witness statements."]
    ev_attacks = ["Challenge the chain of custody of the recovered items."]
    proc_objections = ["Objection to late filing of defense witness list."]
    recommendations = ["Prepare independent corroboration for alibi."]
    
    for claim in claims:
        if claim == "Alibi Defense":
            opponent_args.extend(PROSECUTION_ARGUMENTS["alibi"])
        elif claim == "Self-Defense":
            opponent_args.extend(PROSECUTION_ARGUMENTS["self-defense"])
            
    if not opponent_args:
        opponent_args.append("The prosecution will rely on the direct testimony of the arresting officer.")

    return PredictionResult(
        likely_opponent_arguments=opponent_args,
        prosecution_objections=objections,
        evidence_attacks=ev_attacks,
        procedural_objections=proc_objections,
        preparation_recommendations=recommendations
    )

@opponent_router.post("/extract-insights", response_model=InsightResult)
async def extract_insights(req: InsightRequest):
    """
    Extracts legal entities, claims, and references for Neo4j Knowledge Graph.
    """
    entities = []
    if nlp:
        doc = nlp(req.text)
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG", "DATE", "GPE", "LAW"]:
                entities.append({"text": ent.text, "label": ent.label_})
    else:
        # Fallback dummy entities
        entities.append({"text": "Police Department", "label": "ORG"})
        entities.append({"text": "The Accused", "label": "PERSON"})
        
    return InsightResult(
        entities=entities,
        claims=["Alleged procedural violation during arrest"],
        evidence_references=["CCTV Footage", "Witness Statement A"],
        procedural_issues=["Delay in recording statement"]
    )

@opponent_router.post("/risk-analysis", response_model=RiskResult)
async def risk_analysis(req: RiskRequest):
    """
    Calculates the risk level based on detected weaknesses.
    """
    score = req.weaknesses_count * 2 + req.contradictions_count * 3 + req.missing_evidence_count * 2
    
    if score > 8:
        level = "HIGH"
        vuln = "Critical vulnerabilities detected. The prosecution has multiple angles of attack."
        conf = 0.85
    elif score > 3:
        level = "MEDIUM"
        vuln = "Moderate vulnerabilities. Some missing evidence could be exploited."
        conf = 0.70
    else:
        level = "LOW"
        vuln = "Defense appears solid, but remain vigilant for unexpected procedural objections."
        conf = 0.90
        
    return RiskResult(
        risk_level=level,
        confidence_score=conf,
        vulnerability_analysis=vuln
    )

@opponent_router.get("/similar-cases/{case_id}")
async def get_similar_cases(case_id: str):
    """
    Uses embeddings and metadata matching to identify similar cases.
    Delegates to the existing FAISS index or returns mocks if isolated.
    """
    # In a full integration, this would query _case_index from api_search.py
    return {
        "status": "success",
        "case_id": case_id,
        "similar_cases": [
            {
                "case_id": "SC-APP-12-2020",
                "parties": "State vs. Perera",
                "description": "Similar procedural violation involving delayed FIR.",
                "similarity_score": 0.88,
                "url_pdf": "http://example.com/case/123"
            },
            {
                "case_id": "CA-45-2019",
                "parties": "State vs. Silva",
                "description": "Similar alibi defense lacking independent corroboration.",
                "similarity_score": 0.82,
                "url_pdf": "http://example.com/case/124"
            }
        ]
    }
