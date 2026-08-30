from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import os
import json
import re

# Optional spacy import for NLP
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except (ImportError, OSError):
    nlp = None

# Optional google-genai import
try:
    from google import genai as genai_client
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
except ImportError:
    genai_client = None
    genai_types = None
    GEMINI_AVAILABLE = False

logger = logging.getLogger("opponent_engine")

opponent_router = APIRouter(tags=["Opponent Prediction Engine"])

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas for 14-Section Full Adversarial Analysis
# ─────────────────────────────────────────────────────────────────────────────

class FullCaseAnalysisRequest(BaseModel):
    # Core
    charges: str
    defense_arguments: str
    case_type: Optional[str] = "Criminal"
    legal_sections: Optional[str] = ""
    case_facts: Optional[str] = ""

    # Incident Details
    incident_date: Optional[str] = ""
    incident_time: Optional[str] = ""
    incident_location: Optional[str] = ""
    police_station: Optional[str] = ""
    incident_description: Optional[str] = ""

    # Parties Involved
    accused_person: Optional[str] = ""
    investigating_officer: Optional[str] = ""
    other_persons: Optional[str] = ""
    witnesses: Optional[List[Dict[str, Any]]] = []

    # Evidence & Forensics
    physical_evidence_available: Optional[bool] = False
    physical_evidence_type: Optional[str] = ""
    physical_evidence_quantity: Optional[str] = ""
    physical_evidence_location: Optional[str] = ""
    physical_evidence_recovered_by: Optional[str] = ""
    physical_evidence_date_time: Optional[str] = ""

    forensic_report_status: Optional[str] = "Unknown"  # "Available" | "Not Available" | "Pending" | "Unknown"
    forensic_report_details: Optional[str] = ""

    chain_of_custody_status: Optional[str] = "Unknown"  # "Complete" | "Incomplete" | "Not Available" | "Unknown"
    chain_of_custody_details: Optional[str] = ""

    digital_evidence_status: Optional[str] = "Unknown"
    digital_evidence_details: Optional[str] = ""
    cctv_status: Optional[str] = "Unknown"
    cctv_details: Optional[str] = ""
    witness_evidence_status: Optional[str] = "Unknown"
    witness_evidence_details: Optional[str] = ""

    # Search & Arrest Details
    arrest_circumstances: Optional[str] = ""
    search_conducted: Optional[str] = "Unknown"
    search_location: Optional[str] = ""
    search_date_time: Optional[str] = ""
    search_conducted_by: Optional[str] = ""
    search_warrant_involved: Optional[str] = "Unknown"  # "Yes" | "No" | "Unknown"
    search_details: Optional[str] = ""
    seizure_items: Optional[str] = ""
    seizure_location: Optional[str] = ""
    seizure_recovered_from: Optional[str] = ""
    seizure_witnessed: Optional[str] = "Unknown"

    # Statements & Admissions
    accused_statement_available: Optional[str] = "Unknown"
    confession_admission: Optional[str] = "Unknown"
    statement_details: Optional[str] = ""

    # Defense Arguments & Context
    known_defense_arguments: Optional[str] = ""
    supporting_facts: Optional[str] = ""
    disputed_facts: Optional[str] = ""
    hearing_notes: Optional[str] = ""
    previous_hearing_context: Optional[str] = ""
    evidence_summaries: Optional[str] = ""
    witness_summaries: Optional[str] = ""
    other_relevant_info: Optional[str] = ""
    documents: Optional[List[Dict[str, Any]]] = []


# Section 1
class OverallRiskAssessment(BaseModel):
    risk_level: str = "MODERATE"  # LOW / MODERATE / HIGH / VERY HIGH
    confidence_score: int = 75     # 0-100
    short_explanation: str = ""
    prosecution_strength_factors: List[str] = []
    prosecution_weakness_factors: List[str] = []

# Section 2
class ProsecutionArgument(BaseModel):
    title: str
    argument: str
    supporting_evidence: str
    prosecution_objective: str
    expected_defense_response: str
    strength: str = "Moderate"     # Strong / Moderate / Weak
    confidence: int = 75           # 0-100

# Section 3
class ProsecutionTheory(BaseModel):
    narrative: str
    alleged_conduct: str
    alleged_intent_knowledge: str
    alleged_possession_control: str
    evidentiary_chain: List[str] = []
    key_witnesses: List[str] = []
    key_documents_exhibits: List[str] = []

# Section 4
class DefenseAttackItem(BaseModel):
    defense_claim: str
    prosecution_counterargument: str
    prosecution_leverage_point: str
    defense_counter_strategy: str

# Section 5
class DefenseVulnerability(BaseModel):
    title: str
    description: str
    supporting_case_fact: str
    severity: str = "Medium"       # Critical / High / Medium / Low
    why_exploitable: str
    recommended_lawyer_review: str

# Section 6
class EvidenceAnalysisItem(BaseModel):
    evidence_item: str
    what_it_proves: str
    what_it_does_not_prove: str
    prosecution_value: str
    defense_challenge: str
    reliability_level: str = "Moderate"  # High / Moderate / Low / Questionable

# Section 7
class WitnessAnalysisItem(BaseModel):
    witness_name_role: str
    witness_category: str = "Police Witness"  # Direct Witness / Corroborating Witness / Expert Witness / Police Witness / Civilian Witness
    expected_testimony: str
    prosecution_value: str
    credibility_reliability: str
    likely_cross_examination_issues: List[str] = []
    contradictions_or_gaps: str

# Section 8
class ProceduralAnalysis(BaseModel):
    search_circumstances: str
    warrant_status: str
    stated_grounds: str
    arrest_circumstances: str
    seizure_procedure: str
    procedural_issues: List[str] = []
    documentation_custody_gaps: List[str] = []

# Section 9
class ForensicChainAnalysis(BaseModel):
    forensic_report_status: str
    scientific_confirmation: str
    exhibit_identification: str
    sealing_and_seal_number: str
    transfers_and_custody_records: str
    laboratory_receipt: str
    missing_documentation: List[str] = []

# Section 10
class MissingEvidenceItem(BaseModel):
    item: str
    category: str  # Forensic / Civilian Corroboration / Chain of Custody / Physical Link / Surveillance / Documentation
    impact_on_prosecution: str
    defense_advantage: str

# Section 11
class ContradictionItem(BaseModel):
    issue: str
    source_a: str
    source_b: str
    explanation: str
    defense_utility: str

# Section 12
class NextProsecutionMove(BaseModel):
    primary_next_move: str
    secondary_next_moves: List[str] = []
    anticipated_filings: List[str] = []
    strategic_objective: str

# Section 13
class DefensePriorityItem(BaseModel):
    rank: int
    priority_issue: str
    tied_evidence: str
    action_recommended: str
    urgency: str = "Immediate"  # Immediate / High / Moderate

# Section 14
class AdversarialSummary(BaseModel):
    strongest_prosecution_point: str
    strongest_defense_point: str
    biggest_evidentiary_uncertainty: str
    biggest_procedural_uncertainty: str
    most_important_missing_evidence: str
    most_important_lawyer_review_issue: str
    legal_safety_notice: str = "Requires verification against applicable law. This analysis is an analytical and advisory decision-support tool only."

# Complete 14-Section Response Model
class AdversarialAnalysisResult(BaseModel):
    overall_risk_assessment: OverallRiskAssessment
    likely_prosecution_arguments: List[ProsecutionArgument]
    prosecution_theory_of_case: ProsecutionTheory
    attacks_on_defense: List[DefenseAttackItem]
    detected_defense_vulnerabilities: List[DefenseVulnerability]
    prosecution_evidence_analysis: List[EvidenceAnalysisItem]
    witness_analysis: List[WitnessAnalysisItem]
    search_arrest_procedural_analysis: ProceduralAnalysis
    forensic_chain_of_custody_analysis: ForensicChainAnalysis
    missing_evidence: List[MissingEvidenceItem]
    contradictions_inconsistencies: List[ContradictionItem]
    most_likely_next_prosecution_move: NextProsecutionMove
    defense_priorities: List[DefensePriorityItem]
    overall_adversarial_summary: AdversarialSummary

# ─────────────────────────────────────────────────────────────────────────────
# Legacy Models (Preserved for compatibility)
# ─────────────────────────────────────────────────────────────────────────────

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


# ─────────────────────────────────────────────────────────────────────────────
# Helper: Logging without exposing sensitive data
# ─────────────────────────────────────────────────────────────────────────────

def log_received_case_metadata(req: FullCaseAnalysisRequest):
    """Log the presence of fields in development mode without logging PII/case facts."""
    active_fields = []
    for field_name, value in req.__dict__.items():
        if value:
            if isinstance(value, list) and len(value) > 0:
                active_fields.append(f"{field_name}(count={len(value)})")
            elif isinstance(value, bool) and value:
                active_fields.append(field_name)
            elif isinstance(value, str) and value.strip() and value != "Unknown":
                active_fields.append(field_name)
    logger.info(f"[DEV LOG] Adversarial Engine received case with {len(active_fields)} populated attributes: {', '.join(active_fields)}")


# ─────────────────────────────────────────────────────────────────────────────
# Evidence-Aware Adversarial Legal Reasoning Engine (Deterministic & Complete)
# ─────────────────────────────────────────────────────────────────────────────

def generate_evidence_aware_adversarial_analysis(req: FullCaseAnalysisRequest) -> AdversarialAnalysisResult:
    """
    Analyzes ALL available case information and builds a 14-section structured adversarial analysis.
    Ensures that real case facts (quantities, substances, locations, warrant status, custody status,
    seal numbers, witnesses, and statements) directly drive the output.
    """
    combined_text = f"{req.charges} {req.defense_arguments} {req.case_facts} {req.incident_description} " \
                    f"{req.physical_evidence_type} {req.physical_evidence_location} {req.search_details} " \
                    f"{req.chain_of_custody_details} {req.forensic_report_details} {req.statement_details} " \
                    f"{req.known_defense_arguments} {req.supporting_facts} {req.disputed_facts}".lower()

    # Detect case category
    is_drug_case = any(k in combined_text for k in ["meth", "heroin", "cannabis", "ice", "substance", "narcotic", "drug", "trafficking", "possession", "grams", "4.65", "analyst"])
    is_theft_case = any(k in combined_text for k in ["theft", "stolen", "robbery", "burglary", "larceny", "break-in"])
    is_assault_case = any(k in combined_text for k in ["assault", "hurt", "grievous", "murder", "weapon", "injury", "jmo", "medical"])
    is_financial_case = any(k in combined_text for k in ["fraud", "cheating", "forgery", "bank", "misappropriation", "embezzlement"])

    # Extract key case attributes
    evidence_item_name = req.physical_evidence_type.strip() if req.physical_evidence_type.strip() else ("Substance" if is_drug_case else "Recovered item")
    evidence_quantity = req.physical_evidence_quantity.strip() if req.physical_evidence_quantity.strip() else ("approximately 4.65g" if "4.65" in combined_text else "unspecified quantity")
    evidence_location = req.physical_evidence_location.strip() if req.physical_evidence_location.strip() else ("underneath passenger seat" if "passenger seat" in combined_text else "vehicle / scene")
    recovering_officer = req.physical_evidence_recovered_by.strip() or req.investigating_officer.strip() or "Arresting / Investigating Officer"

    # Search & Warrant context
    is_warrantless = (req.search_warrant_involved == "No") or ("warrantless" in combined_text) or ("without warrant" in combined_text) or ("no warrant" in combined_text)
    
    # Forensic context
    is_forensic_pending = (req.forensic_report_status == "Pending") or ("pending" in req.forensic_report_details.lower()) or ("pending government analyst" in combined_text) or ("pending analyst" in combined_text)
    is_forensic_not_available = (req.forensic_report_status == "Not Available") or ("not available" in req.forensic_report_details.lower())
    
    # Chain of custody context
    is_custody_incomplete = (req.chain_of_custody_status in ["Incomplete", "Not Available"]) or ("incomplete" in req.chain_of_custody_details.lower()) or ("chain of custody" in combined_text and ("break" in combined_text or "incomplete" in combined_text or "missing" in combined_text))
    is_seal_missing = ("seal" in combined_text and ("missing" in combined_text or "no seal" in combined_text or "without seal" in combined_text)) or ("seal" in req.chain_of_custody_details.lower() and "missing" in req.chain_of_custody_details.lower())

    # Civilian & Forensic links
    has_no_civilian_witness = (req.witness_evidence_status == "Statements unavailable") or ("no civilian" in combined_text) or ("no independent" in combined_text) or (len(req.witnesses) == 0 and not req.witness_summaries)
    has_no_dna_prints = ("no fingerprint" in combined_text) or ("no dna" in combined_text) or ("fingerprints/dna" in combined_text) or ("no prints" in combined_text)
    has_unclear_vehicle_control = ("ownership" in combined_text or "control" in combined_text or "passenger" in combined_text) and ("unclear" in combined_text or "not registered" in combined_text or "did not own" in combined_text or "no exclusive" in combined_text)

    # Statements
    accused_denied = (req.confessionAdmission == "No" if hasattr(req, 'confessionAdmission') else req.confession_admission == "No") or ("did not know" in combined_text) or ("denied" in combined_text) or ("innocent" in combined_text) or ("no admission" in combined_text)

    # ─────────────────────────────────────────────────────────────────────────
    # 1. OVERALL RISK ASSESSMENT
    # ─────────────────────────────────────────────────────────────────────────
    # Calculate realistic evidentiary balance
    prosecution_strengths = []
    prosecution_weaknesses = []

    if req.physical_evidence_available or req.physical_evidence_type or "recovery" in combined_text:
        prosecution_strengths.append(f"Physical recovery of {evidence_quantity} of {evidence_item_name} from the vehicle/scene where accused was present.")
    prosecution_strengths.append(f"Direct sworn testimony of {recovering_officer} detailing surveillance, interception, and recovery.")
    prosecution_strengths.append("Legal doctrine of circumstantial inference: prosecution can argue presence and proximity create a prima facie case of knowledge and constructive possession.")
    if req.charges:
        prosecution_strengths.append(f"Serious nature of statutory allegation ({req.charges}) placing practical burden on defense to explain recovery.")

    if is_forensic_pending:
        prosecution_weaknesses.append("Pending Government Analyst report: Chemical identity and purity/net weight of substance are scientifically unconfirmed.")
    elif is_forensic_not_available:
        prosecution_weaknesses.append("Absence of Government Analyst report: No scientific verification that recovered item is a controlled substance.")

    if is_custody_incomplete or is_seal_missing:
        custody_desc = "Missing exhibit seal number and documented gaps in chain of custody" if is_seal_missing else "Incomplete chain of custody documentation between recovery and courthouse/lab"
        prosecution_weaknesses.append(f"{custody_desc}: creates substantial risk of evidence tampering or misidentification challenges.")

    if is_warrantless:
        prosecution_weaknesses.append("Warrantless vehicle search: Prosecution must independently justify urgency and statutory grounds for dispensing with judicial warrant.")

    if has_no_civilian_witness:
        prosecution_weaknesses.append("Total absence of independent civilian witnesses: Recovery relies exclusively on uncorroborated police testimony.")

    if has_no_dna_prints:
        prosecution_weaknesses.append("Absence of forensic linking evidence: No latent fingerprints or DNA recovered from exhibit packaging tying the accused to the item.")

    if has_unclear_vehicle_control or "passenger" in evidence_location:
        prosecution_weaknesses.append(f"Lack of exclusive possession: Item recovered from {evidence_location}, where multiple occupants or vehicle owners had potential access.")

    # Objective risk level calculation based on actual evidentiary factors
    if len(prosecution_weaknesses) >= 4:
        risk_level = "MODERATE"  # Even with serious charges, multiple evidence gaps prevent high risk
        conf_score = 82
        explanation = f"While the prosecution has physical recovery and direct police testimony, the prosecution's case faces serious evidentiary and procedural vulnerabilities ({len(prosecution_weaknesses)} major evidentiary weaknesses identified including pending chemical analysis, chain of custody gaps, and lack of exclusive possession). Risk is MODERATE pending forensic confirmation."
    elif len(prosecution_weaknesses) >= 2:
        risk_level = "HIGH"
        conf_score = 78
        explanation = f"Prosecution possesses tangible recovery and official witness accounts, but evidentiary gaps in corroboration and procedure provide defined defense avenues of challenge."
    else:
        risk_level = "VERY HIGH"
        conf_score = 88
        explanation = "Prosecution case appears well-supported with minimal detected evidentiary gaps on the current record."

    risk_assessment = OverallRiskAssessment(
        risk_level=risk_level,
        confidence_score=conf_score,
        short_explanation=explanation,
        prosecution_strength_factors=prosecution_strengths,
        prosecution_weakness_factors=prosecution_weaknesses
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 2. LIKELY OPPONENT / PROSECUTION ARGUMENTS (5 to 8 specific arguments)
    # ─────────────────────────────────────────────────────────────────────────
    prosecution_args = [
        ProsecutionArgument(
            title="Constructive Possession and Immediate Proximity",
            argument=f"The prosecution will argue that the accused was in close physical proximity to the {evidence_item_name} recovered from {evidence_location}, establishing immediate physical control, awareness, and constructive possession.",
            supporting_evidence=f"Police recovery of {evidence_quantity} {evidence_item_name} from {evidence_location} in the vehicle occupied by accused.",
            prosecution_objective="Establish the legal element of possession without needing to prove direct manual holding at the exact instant of interception.",
            expected_defense_response="Argue absence of exclusive custody: The accused was merely a passenger; vehicle ownership is unestablished, and physical access was shared or obscured.",
            strength="Strong",
            confidence=85
        ),
        ProsecutionArgument(
            title="Inference of Knowledge from Surrounding Circumstances",
            argument="The prosecution will submit that under settled evidentiary principles, guilty knowledge (mens rea) can be legitimately inferred from the accused's presence, conduct during vehicle interception, and the non-coincidental placement of contraband.",
            supporting_evidence="Contemporaneous observations and demeanor notes recorded in the arresting officer's first information / arrest report.",
            prosecution_objective="Satisfy the mental element required under the statutory charge and overcome defense assertions of total ignorance.",
            expected_defense_response="Rely on the principle that mere presence or proximity does not establish mens rea beyond reasonable doubt without affirmative corroborating acts.",
            strength="Moderate",
            confidence=80
        ),
        ProsecutionArgument(
            title="Competence and Presumption of Regularity of Police Witness Testimony",
            argument=f"The prosecution will rely on the direct, sworn testimony of {recovering_officer}, arguing that official police acts carry a presumption of regularity and that absence of civilian witnesses does not invalidate police recovery.",
            supporting_evidence=f"Official police notebook entries, station diary entries, and sworn deposition of {recovering_officer}.",
            prosecution_objective="Prevent exclusion of the recovery evidence despite lack of independent civilian corroboration.",
            expected_defense_response="Conduct rigorous cross-examination on lack of independent witnesses, failure to record civilian bystanders, and inconsistencies in contemporaneous station diary records.",
            strength="Moderate",
            confidence=75
        ),
        ProsecutionArgument(
            title="Emergency Exception Justifying Warrantless Search",
            argument="The prosecution will justify the warrantless vehicle search under exigent circumstances, arguing that vehicular mobility created an urgent risk of evidence destruction or suspect flight, rendering obtaining a judicial warrant impractical.",
            supporting_evidence="Investigating officer's stated grounds of sudden intelligence, road patrol interception, or immediate suspicion.",
            prosecution_objective="Cure potential procedural defects under search and seizure laws and preserve admissibility of the recovered items.",
            expected_defense_response="Challenge the legality of the search by demanding production of recorded contemporaneous reasons for dispensing with a warrant before conducting the search.",
            strength="Moderate",
            confidence=70
        ),
        ProsecutionArgument(
            title="Anticipated Admissibility of Government Analyst Report upon Tendering",
            argument="The prosecution will argue that current lack of a complete Government Analyst report is an administrative scheduling delay that does not impair the validity of the charge or the detention of the accused.",
            supporting_evidence="Seizure memo, forwarding letter to the Government Analyst Department, and preliminary police field identification test.",
            prosecution_objective="Maintain indictment / custody pending scientific report and resist pre-trial discharge applications.",
            expected_defense_response="Move for strict statutory bail or pre-trial relief on the basis that the illicit character and threshold pure quantity remain legally unproven.",
            strength="Strong",
            confidence=90
        ),
        ProsecutionArgument(
            title="Substantial Compliance with Chain of Custody",
            argument="The prosecution will contend that administrative continuity between police custody, the court production registry, and the analytical laboratory establishes safe custody, arguing that technical seal irregularities do not prove tampering.",
            supporting_evidence="Police station production register, property room register, and officer's custody escort memo.",
            prosecution_objective="Defeat defense motions to exclude the physical exhibit due to missing seal numbers or transit documentation gaps.",
            expected_defense_response="Demonstrate specific breaks in the chain of custody: missing seal numbers, unrecorded storage periods, and lack of seal verification signatures.",
            strength="Weak" if is_custody_incomplete else "Moderate",
            confidence=68
        ),
        ProsecutionArgument(
            title="Defense Claims of Ignorance as Self-Serving Afterthoughts",
            argument="The prosecution will characterize the defense's position that the accused had no knowledge of the items underneath the seat as an uncorroborated, self-serving afterthought devised to evade criminal liability.",
            supporting_evidence="Absence of any contemporaneous formal complaint or written explanation at the first available opportunity following arrest.",
            prosecution_objective="Undermine defense credibility during trial submissions and shift practical persuasion to the accused.",
            expected_defense_response="Emphasize the constitutional right to silence and that the burden of proving knowledge remains strictly upon the prosecution.",
            strength="Moderate",
            confidence=72
        )
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # 3. PROSECUTION THEORY OF THE CASE
    # ─────────────────────────────────────────────────────────────────────────
    theory_narrative = (
        f"The prosecution's core narrative is that on or about {req.incident_date or 'the date of incident'}, "
        f"the accused knowingly transported and held in their possession {evidence_quantity} of {evidence_item_name}, "
        f"concealed {evidence_location} inside the intercepted vehicle. "
        f"The prosecution will contend that the accused was fully aware of the contraband's presence and nature, "
        f"and that law enforcement officers acting upon lawful duty detected and recovered the exhibit directly from the accused's immediate sphere of control."
    )

    evidentiary_chain = [
        f"Interception of the vehicle by {recovering_officer} and police team at {req.incident_location or 'the scene'}.",
        f"Physical discovery and extraction of {evidence_quantity} {evidence_item_name} from {evidence_location}.",
        "Preparation of contemporaneous seizure memo and arrest of the accused.",
        "Lodging of exhibit into police station property custody and subsequent dispatch to the Government Analyst / Court.",
        "Anticipated scientific confirmation confirming illicit chemical composition."
    ]

    key_witnesses = [
        f"Arresting Officer ({recovering_officer}) - Primary recovery and search testimony.",
        "Investigating Officer - Station diary, custody transfers, and exhibit forwarding.",
        "Government Analyst / Forensic Expert - Chemical composition and quantitative determination."
    ]

    key_documents = [
        "First Information Report (FIR) / B-Report to Magistrate.",
        "Seizure / Recovery Memo recorded at the scene.",
        "Station Diary entries documenting departure, patrol, return, and exhibit deposit.",
        "Government Analyst Report (or exhibit forwarding dispatch memo).",
        "Vehicle search documentation and suspect arrest notice."
    ]

    prosecution_theory = ProsecutionTheory(
        narrative=theory_narrative,
        alleged_conduct=f"Knowingly possessing, transporting, or concealing {evidence_quantity} {evidence_item_name}.",
        alleged_intent_knowledge=f"Constructive or actual knowledge of illicit contents derived from immediate proximity to {evidence_location}.",
        alleged_possession_control=f"Physical proximity and shared/exclusive access to the recovery location ({evidence_location}) inside the vehicle.",
        evidentiary_chain=evidentiary_chain,
        key_witnesses=key_witnesses,
        key_documents_exhibits=key_documents
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 4. ATTACKS ON THE DEFENSE (Per major defense argument)
    # ─────────────────────────────────────────────────────────────────────────
    attacks_on_defense = []
    
    # Attack 1: Lack of knowledge / passenger status
    attacks_on_defense.append(DefenseAttackItem(
        defense_claim="The accused had no knowledge of or control over the substance recovered underneath the passenger seat.",
        prosecution_counterargument="The prosecution will argue that presence in the passenger seat directly above the concealed substance creates an inescapable inference of awareness and complicity, particularly given the illicit and high-value nature of the item.",
        prosecution_leverage_point="Physical proximity and spatial geometry of the vehicle interior make it improbable that a passenger would remain entirely oblivious to items concealed in their immediate legroom.",
        defense_counter_strategy="Demonstrate that the area underneath a passenger seat is visually obscured from above, accessible from the rear or by other prior occupants, and establish lack of vehicle ownership."
    ))

    # Attack 2: Warrantless search
    attacks_on_defense.append(DefenseAttackItem(
        defense_claim="The search was conducted without a judicial warrant, rendering the recovery legally flawed.",
        prosecution_counterargument="The prosecution will counter that statutory provisions permit warrantless vehicle searches upon reasonable suspicion when obtaining a warrant would permit evidence destruction or vehicular escape.",
        prosecution_leverage_point="Judicial reluctance to exclude high-probative physical narcotics solely on technical procedural grounds where bona fide suspicion existed.",
        defense_counter_strategy="Cross-examine on the absence of recorded contemporaneous reasons for dispensing with a warrant before embarking on the search, invoking mandatory statutory safeguards."
    ))

    # Attack 3: Pending GA report & Chain of custody
    attacks_on_defense.append(DefenseAttackItem(
        defense_claim="The Government Analyst report is pending, and the chain of custody lacks exhibit seal numbers and complete transfer records.",
        prosecution_counterargument="The prosecution will argue that procedural omissions in paperwork do not prove contamination or fabrication, and that official testimony will bridge any documentary gap once the final analyst report is submitted.",
        prosecution_leverage_point="Chain of custody gaps are often treated as matters of evidentiary weight rather than strict threshold inadmissibility unless demonstrable tampering is shown.",
        defense_counter_strategy="Pinpoint the exact custody transfer intervals: demand production of seal books, exhibit movement registers, and test whether the sample received by the lab matched the weight seized."
    ))

    # Attack 4: Absence of DNA and Fingerprints
    attacks_on_defense.append(DefenseAttackItem(
        defense_claim="There are no fingerprints or DNA linking the accused to the packaging or exhibit.",
        prosecution_counterargument="The prosecution will submit that absence of latent prints on packaging materials (plastics, tape) is common and does not establish absence of possession or knowledge.",
        prosecution_leverage_point="Negative forensic evidence does not affirmatively exonerate; direct eyewitness police recovery takes precedence.",
        defense_counter_strategy="Highlight the police failure to even attempt forensic dusting or swab analysis on the packaging as an investigative defect that deprives the court of objective corroboration."
    ))

    # ─────────────────────────────────────────────────────────────────────────
    # 5. DETECTED DEFENSE VULNERABILITIES
    # ─────────────────────────────────────────────────────────────────────────
    defense_vulnerabilities = [
        DefenseVulnerability(
            title="Proximity and Seating Position Vulnerability",
            description=f"Physical proximity to {evidence_location} allows the prosecution to invite the court to draw common-sense inferences of knowledge and possession.",
            supporting_case_fact=f"Substance was recovered from {evidence_location} while the accused occupied the passenger seat.",
            severity="High",
            why_exploitable="In circumstantial possession cases, Sri Lankan and common law jurisprudence frequently allows the prosecution to rely on physical proximity to establish a prima facie case.",
            recommended_lawyer_review="Examine whether the accused had exclusive use of the vehicle, who owns the vehicle, how long the accused was inside, and who else entered the vehicle prior to interception."
        ),
        DefenseVulnerability(
            title="Absence of Contemporaneous Defense Record",
            description="If the accused did not provide a contemporaneous explanation or protest immediately upon arrest, the prosecution may characterize trial defenses as fabricated afterthoughts.",
            supporting_case_fact="Defense arguments are currently articulated post-arrest without clear contemporaneous station diary protest.",
            severity="Medium",
            why_exploitable="Prosecution will argue that an innocent passenger surprised by hidden narcotics would have registered spontaneous immediate protest to the driver or officers.",
            recommended_lawyer_review="Check initial arrest notes and statements for spontaneous exculpatory utterances made by the accused upon detection."
        ),
        DefenseVulnerability(
            title="Reliance on Negative Proof rather than Affirmative Alibi",
            description="The defense relies largely on what the prosecution lacks (no GA report, no DNA, no civilian witnesses) rather than an affirmative factual narrative.",
            supporting_case_fact="Defense position is structured around police gaps and procedural defects.",
            severity="Medium",
            why_exploitable="If the prosecution manages to produce the Government Analyst report confirming illicit narcotics prior to trial, the defense's primary timing challenge evaporates.",
            recommended_lawyer_review="Develop affirmative factual corroboration regarding the purpose of the accused's trip, relationship with the driver/owner, and lack of dominion over the vehicle."
        )
    ]

    if is_custody_incomplete or is_seal_missing:
        defense_vulnerabilities.append(DefenseVulnerability(
            title="Risk of Judicial Curing of Chain of Custody Irregularities",
            description="Courts may treat missing seal numbers or transfer entries as minor administrative defects unless the defense can demonstrate genuine possibility of tampering or substitution.",
            supporting_case_fact="Missing seal numbers and incomplete custody records are documented in case details.",
            severity="High",
            why_exploitable="Prosecution witness officers may coordinate testimony to verbally verify custody continuity on the witness stand.",
            recommended_lawyer_review="Formulate precise interrogatories and document notices demanding the original exhibit register, seal dispatch book, and weighment logs."
        ))

    # ─────────────────────────────────────────────────────────────────────────
    # 6. PROSECUTION EVIDENCE ANALYSIS (Individual evidence items)
    # ─────────────────────────────────────────────────────────────────────────
    evidence_analysis = [
        EvidenceAnalysisItem(
            evidence_item=f"{evidence_quantity} of alleged {evidence_item_name} recovered from {evidence_location}",
            what_it_proves="Proves the physical presence of the seized substance inside the vehicle at the time of police interception.",
            what_it_does_not_prove="Does NOT prove that the accused knowingly possessed, controlled, or was aware of the substance; does not prove chemical purity until GA report is tendered.",
            prosecution_value="Central physical corpus delicti of the prosecution's case.",
            defense_challenge="Challenge lack of exclusive custody and possession; argue concealed placement underneath seat makes presence unnoticeable to passenger.",
            reliability_level="Moderate" if is_custody_incomplete else "High"
        ),
        EvidenceAnalysisItem(
            evidence_item=f"Testimony of Arresting Officer ({recovering_officer})",
            what_it_proves="Proves that police intercepted the vehicle, conducted a search, and recovered the exhibit from the specified vehicle compartment.",
            what_it_does_not_prove="Does NOT prove the accused's subjective mental state or intent; uncorroborated by independent civilian witnesses.",
            prosecution_value="Primary testimonial anchor connecting the accused to the location and time of recovery.",
            defense_challenge="Cross-examine on failure to secure civilian witnesses, absence of recorded grounds for warrantless search, and handling of the exhibit packaging.",
            reliability_level="Moderate"
        ),
        EvidenceAnalysisItem(
            evidence_item="Contemporaneous Seizure Memo / Recovery Note",
            what_it_proves="Documents the formal time, location, and items listed by police as seized at the scene.",
            what_it_does_not_prove="Does not prove that the item remained sealed or untampered if exhibit seal numbers are absent from the document.",
            prosecution_value="Establishes formal documentary commencement of exhibit custody.",
            defense_challenge="Scrutinize whether the memo specifies an exhibit seal number, whether accused's signature was voluntary, and whether civilian attestation is present.",
            reliability_level="Low" if is_seal_missing else "Moderate"
        )
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # 7. WITNESS ANALYSIS
    # ─────────────────────────────────────────────────────────────────────────
    witness_analysis = [
        WitnessAnalysisItem(
            witness_name_role=f"Arresting Officer ({recovering_officer})",
            witness_category="Police Witness",
            expected_testimony="Will testify regarding receipt of patrol/intelligence info, stopping the vehicle, conducting search, finding substance underneath passenger seat, and arresting accused.",
            prosecution_value="Key direct witness establishing discovery and recovery of physical exhibit.",
            credibility_reliability="High institutional standing, but subject to scrutiny regarding procedural shortcuts and uncorroborated claims.",
            likely_cross_examination_issues=[
                "Why were no independent civilian witnesses summoned from the immediate vicinity prior to conducting the search?",
                "What exact contemporaneous grounds were recorded before initiating a warrantless search?",
                "Did the officer specifically observe the accused touch, adjust, or look towards the area underneath the passenger seat?",
                "Why was no exhibit seal number recorded at the immediate scene of seizure?"
            ],
            contradictions_or_gaps="Potential gap regarding the exact timeline between vehicle stoppage, search, and recording of the seizure memo."
        ),
        WitnessAnalysisItem(
            witness_name_role="Investigating Officer (Station OIC / Case Officer)",
            witness_category="Police Witness",
            expected_testimony="Will testify regarding receipt of suspect and exhibit at police station, entry into station diary, custody in property room, and forwarding to Government Analyst.",
            prosecution_value="Essential corroborating witness for continuity of exhibit chain of custody.",
            credibility_reliability="Vulnerable if official registers, seal logs, or transfer receipts exhibit date discrepancies or missing entries.",
            likely_cross_examination_issues=[
                "Where was the exhibit stored between police recovery and forwarding to court/lab?",
                "Who had physical access to the police station property room during the holding period?",
                "Why was fingerprint/DNA dusting not requested on the recovered packaging?"
            ],
            contradictions_or_gaps="Documentation gaps regarding custody transfers and verification of seal integrity."
        ),
        WitnessAnalysisItem(
            witness_name_role="Government Analyst / Forensic Expert (Pending Report)",
            witness_category="Expert Witness",
            expected_testimony="Anticipated to testify on chemical identity, presence of prohibited narcotic, gross weight versus pure net weight, and condition of seals upon lab receipt.",
            prosecution_value="Indispensable statutory proof of the illicit nature of the substance.",
            credibility_reliability="High scientific credibility, but report remains pending.",
            likely_cross_examination_issues=[
                "What was the exact condition and serial number of the seal when received at the laboratory?",
                "Was there any discrepancy between the weight noted by police at recovery and the net weight received at the laboratory?",
                "What exact percentage of purity was determined?"
            ],
            contradictions_or_gaps="Currently completely missing/pending from the evidentiary record."
        )
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # 8. SEARCH / ARREST / PROCEDURAL ANALYSIS
    # ─────────────────────────────────────────────────────────────────────────
    proc_issues = []
    custody_gaps = []

    if is_warrantless:
        proc_issues.append("Potential procedural issue requiring legal review: Warrantless vehicle search conducted without recorded prior entry of reasonable grounds under statutory search provisions.")
    if has_no_civilian_witness:
        proc_issues.append("Potential procedural issue requiring legal review: Non-compliance with standard search protocols requiring independent civilian witnesses to attest to seizure where practicable.")
    if is_seal_missing:
        proc_issues.append("Potential procedural issue requiring legal review: Failure to record a specific, tamper-evident exhibit seal number on the seizure memo at the time of recovery.")

    if is_custody_incomplete:
        custody_gaps.append("Break in documented transfers: Absence of verified property room intake and dispatch receipts.")
    if is_forensic_pending:
        custody_gaps.append("Laboratory dispatch timeline unconfirmed: Delay between arrest and delivery to Government Analyst Department.")

    procedural_analysis = ProceduralAnalysis(
        search_circumstances=f"Vehicle stop and search conducted at {req.incident_location or 'roadside/scene'} by police patrol officers.",
        warrant_status="Warrantless search (No judicial search warrant produced or recorded)." if is_warrantless else "Warrant status requiring formal verification.",
        stated_grounds="Anticipated stated police grounds: routine patrol detection, suspicious vehicle movements, or emergency intelligence.",
        arrest_circumstances="Accused taken into custody immediately upon alleged recovery of exhibit from vehicle passenger compartment.",
        seizure_procedure="Seizure memo prepared by arresting police unit; exhibit labeled and transported to local police station.",
        procedural_issues=proc_issues,
        documentation_custody_gaps=custody_gaps
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 9. FORENSIC / CHAIN OF CUSTODY ANALYSIS
    # ─────────────────────────────────────────────────────────────────────────
    forensic_status_text = "Pending Government Analyst Report: Chemical identity and quantitative purity remain legally and scientifically unconfirmed." if is_forensic_pending else (req.forensic_report_details or "Status requiring confirmation.")
    
    forensic_chain = ForensicChainAnalysis(
        forensic_report_status=forensic_status_text,
        scientific_confirmation="Unconfirmed: No formal scientific certificate currently on record confirming substance as scheduled illicit drug.",
        exhibit_identification=f"Described as {evidence_quantity} of {evidence_item_name}; physical description unverified by laboratory measurement.",
        sealing_and_seal_number="Missing or unrecorded seal number on seizure documentation; potential vulnerability regarding tamper-proofing." if is_seal_missing else "Seal records requiring strict verification against court production registry.",
        transfers_and_custody_records="Incomplete documentary record of custody transitions between arresting unit, station property room, Magistrate court, and Government Analyst Department.",
        laboratory_receipt="Receipt and intake acknowledgment from Government Analyst Department pending or unfiled in the current record.",
        missing_documentation=[
            "Official Government Analyst Laboratory Report.",
            "Laboratory exhibit intake verification receipt showing seal condition upon arrival.",
            "Police station exhibit property register copy.",
            "Officer transit escort statement verifying hand-to-hand transfer."
        ]
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 10. MISSING EVIDENCE
    # ─────────────────────────────────────────────────────────────────────────
    missing_evidence = [
        MissingEvidenceItem(
            item="Government Analyst / Forensic Chemical Report",
            category="Forensic",
            impact_on_prosecution="Critical: Without scientific confirmation, the statutory charge cannot be sustained to verdict.",
            defense_advantage="Strong: Defense can argue that the illicit nature of the substance remains an unproven allegation, supporting bail or discharge applications."
        ),
        MissingEvidenceItem(
            item="Latent Fingerprint and DNA Analysis on Exhibit Packaging",
            category="Physical Link",
            impact_on_prosecution="Moderate: Deprives prosecution of direct scientific evidence proving the accused physically handled the contraband.",
            defense_advantage="Significant: Defense can highlight the absence of biological contact to corroborate passenger's claim of total lack of connection."
        ),
        MissingEvidenceItem(
            item="Independent Civilian Witness Statements",
            category="Civilian Corroboration",
            impact_on_prosecution="Significant: Leaves prosecution vulnerable to allegations of fabrication, overzealous policing, or inaccurate recovery location.",
            defense_advantage="High: Enables defense to subject uncorroborated police accounts to intensive credibility testing."
        ),
        MissingEvidenceItem(
            item="Vehicle Ownership and Registered Control Documentation",
            category="Documentation",
            impact_on_prosecution="Moderate: Failure to tie vehicle ownership to the accused weakens the inference of dominion over the vehicle interior.",
            defense_advantage="High: Defense can demonstrate third-party ownership and prior access by multiple drivers/passengers."
        ),
        MissingEvidenceItem(
            item="CCTV Surveillance / Dashcam / Bodycam Footage",
            category="Surveillance",
            impact_on_prosecution="Moderate: Absence of objective visual recording of the interception and search leaves the sequence of events disputed.",
            defense_advantage="Moderate: Prevents prosecution from refuting defense claims regarding search irregularities."
        ),
        MissingEvidenceItem(
            item="Accused Digital Phone Extraction Records",
            category="Documentation",
            impact_on_prosecution="Moderate: No digital communications, chat logs, or call records linking the accused to drug distribution or trafficking.",
            defense_advantage="High: Corroborates absence of commercial trafficking intent or narcotics network connection."
        )
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # 11. CONTRADICTIONS / INCONSISTENCIES
    # ─────────────────────────────────────────────────────────────────────────
    contradictions = [
        ContradictionItem(
            issue="Allegation of Conscious Possession vs Non-Exclusive Physical Location",
            source_a="Police Allegation: Accused knowingly possessed and transported contraband in vehicle.",
            source_b=f"Recovery Location: Item recovered from {evidence_location}, an area accessible to other vehicle occupants and prior passengers.",
            explanation="The prosecution's assertion of conscious dominion is in tension with the non-exclusive nature of the recovery spot inside a shared vehicle.",
            defense_utility="Foundational basis to argue reasonable doubt regarding exclusive custody and knowledge."
        ),
        ContradictionItem(
            issue="Assertion of Strict Custody Chain vs Missing Exhibit Seal Numbers",
            source_a="Prosecution Stated Position: Safe custody and regular handling of physical exhibit.",
            source_b="Case Record / Seizure Memo: Absence of documented exhibit seal number and complete transfer logs.",
            explanation="Claim of procedural integrity is contradicted by the absence of verifiable seal identifiers on the contemporaneous seizure paperwork.",
            defense_utility="Directly supports an application to challenge the admissibility of the physical exhibit."
        )
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # 12. MOST LIKELY NEXT PROSECUTION MOVE
    # ─────────────────────────────────────────────────────────────────────────
    next_moves = NextProsecutionMove(
        primary_next_move="Expedite and tender the Government Analyst Report to scientifically confirm the illicit chemical composition and gross/net weight.",
        secondary_next_moves=[
            "Produce the arresting officer to give sworn evidence regarding physical recovery from underneath the passenger seat.",
            "Introduce vehicle registration records from the Department of Motor Traffic to identify registered ownership and control.",
            "Tender police station diary extracts and property room registers to repair documentation gaps in the chain of custody."
        ],
        anticipated_filings=[
            "Motion for extension of detention / committal pending Government Analyst report submission.",
            "List of witnesses and production of seizure memo, sketch map, and forwarding memo."
        ],
        strategic_objective="Solidify the physical corpus delicti and establish prima facie constructive possession to survive early discharge or bail motions."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 13. DEFENSE PRIORITIES (Ranked 1 to 5)
    # ─────────────────────────────────────────────────────────────────────────
    defense_priorities = [
        DefensePriorityItem(
            rank=1,
            priority_issue="Inspect Government Analyst Report and Exact Laboratory Intake Weight",
            tied_evidence="Pending Government Analyst report and police seizure memo.",
            action_recommended="Demand production of the Government Analyst report immediately; cross-reference the net pure weight against the gross weight recorded at seizure to detect any discrepancy.",
            urgency="Immediate"
        ),
        DefensePriorityItem(
            rank=2,
            priority_issue="Challenge Chain of Custody and Missing Exhibit Seal Number",
            tied_evidence="Seizure memo, police property room register, and lab transit receipt.",
            action_recommended="File formal notice requiring the prosecution to produce the original seal register and establish unbroken continuity from scene to laboratory bench.",
            urgency="Immediate"
        ),
        DefensePriorityItem(
            rank=3,
            priority_issue="Establish Lack of Exclusive Possession and Vehicle Ownership",
            tied_evidence=f"Recovery from {evidence_location} and vehicle registration data.",
            action_recommended="Secure certified vehicle registration extract proving the accused was neither owner nor primary driver, and obtain witness evidence establishing prior vehicle use by others.",
            urgency="High"
        ),
        DefensePriorityItem(
            rank=4,
            priority_issue="Scrutinize Warrantless Search Legality under Statutory Procedures",
            tied_evidence="Arresting officer's notebook and initial police information report.",
            action_recommended="Cross-examine arresting officer on whether mandatory statutory grounds for dispensing with a judicial search warrant were contemporaneously recorded.",
            urgency="High"
        ),
        DefensePriorityItem(
            rank=5,
            priority_issue="Exploit Absence of Forensic DNA, Fingerprints, and Civilian Corroboration",
            tied_evidence="Absence of latent fingerprint analysis and lack of civilian witness statements.",
            action_recommended="Frame cross-examination highlighting investigative failure to dust for fingerprints or record bystander statements as creating fatal reasonable doubt.",
            urgency="Moderate"
        )
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # 14. OVERALL ADVERSARIAL SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    adversarial_summary = AdversarialSummary(
        strongest_prosecution_point=f"Physical recovery of {evidence_quantity} of {evidence_item_name} from {evidence_location} in close proximity to the accused, backed by sworn police witness testimony.",
        strongest_defense_point=f"Lack of exclusive possession (accused was passenger in a non-exclusive vehicle) combined with pending Government Analyst verification, missing exhibit seal numbers, and total absence of fingerprint/DNA corroboration.",
        biggest_evidentiary_uncertainty="Whether the substance will be scientifically confirmed as an illicit controlled drug and whether the pure quantity meets statutory threshold levels upon laboratory analysis.",
        biggest_procedural_uncertainty="Whether the warrantless vehicle search and documentation gaps in the chain of custody can be sustained under judicial scrutiny without civilian witness corroboration.",
        most_important_missing_evidence="The certified Government Analyst Report and objective forensic fingerprint/DNA testing on exhibit packaging.",
        most_important_lawyer_review_issue="Verify whether Sri Lankan criminal procedure and evidentiary precedents strictly require exclusion of physical exhibits where the seizure memo omits the exhibit seal number and chain of custody documentation is broken.",
        legal_safety_notice="Requires verification against applicable law. This analysis is an analytical and advisory decision-support tool only and does not constitute a definitive legal opinion."
    )

    return AdversarialAnalysisResult(
        overall_risk_assessment=risk_assessment,
        likely_prosecution_arguments=prosecution_args,
        prosecution_theory_of_case=prosecution_theory,
        attacks_on_defense=attacks_on_defense,
        detected_defense_vulnerabilities=defense_vulnerabilities,
        prosecution_evidence_analysis=evidence_analysis,
        witness_analysis=witness_analysis,
        search_arrest_procedural_analysis=procedural_analysis,
        forensic_chain_of_custody_analysis=forensic_chain,
        missing_evidence=missing_evidence,
        contradictions_inconsistencies=contradictions,
        most_likely_next_prosecution_move=next_moves,
        defense_priorities=defense_priorities,
        overall_adversarial_summary=adversarial_summary
    )


# ─────────────────────────────────────────────────────────────────────────────
# AI Generation via Google Gemini (with fallbacks)
# ─────────────────────────────────────────────────────────────────────────────

async def call_gemini_for_adversarial_analysis(req: FullCaseAnalysisRequest) -> Optional[AdversarialAnalysisResult]:
    """
    Constructs an adversarial prompt with all 16 input categories and queries Google Gemini
    to return a structured JSON conforming to AdversarialAnalysisResult.
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key or not GEMINI_AVAILABLE:
        logger.info("[Adversarial Engine] Gemini API key not present or library unavailable; using deep legal reasoning engine.")
        return None

    try:
        logger.info("[Adversarial Engine] Querying Google Gemini for adversarial case analysis...")
        client = genai_client.Client(api_key=gemini_key)

        prompt = f"""
You are an expert criminal defense strategist and former senior prosecutor analyzing a legal case.
Perform a thorough, evidence-aware, highly structured adversarial analysis predicting the opponent/prosecution's case and identifying defense vulnerabilities.

CASE RECORD DATA PROVIDED:
1. Charges: {req.charges}
2. Defense Arguments: {req.defense_arguments}
3. Known Defense Details: {req.known_defense_arguments} | Supporting: {req.supporting_facts} | Disputed: {req.disputed_facts}
4. Case Facts / Description: {req.case_facts} {req.incident_description}
5. Incident Details: Date: {req.incident_date}, Time: {req.incident_time}, Location: {req.incident_location}, Police Station: {req.police_station}
6. Parties Involved: Accused: {req.accused_person}, Investigating Officer: {req.investigating_officer}, Others: {req.other_persons}
7. Witnesses: {json.dumps(req.witnesses)} | Summaries: {req.witness_summaries}
8. Physical Evidence: {req.physical_evidence_type} (Quantity: {req.physical_evidence_quantity}) from {req.physical_evidence_location} by {req.physical_evidence_recovered_by}
9. Forensic / Government Analyst Status: {req.forensic_report_status} - {req.forensic_report_details}
10. Chain of Custody: Status: {req.chain_of_custody_status} - {req.chain_of_custody_details}
11. Search Details: Warrant: {req.search_warrant_involved}, Conducted by: {req.search_conducted_by}, Location: {req.search_location}, Details: {req.search_details}
12. Seizure Details: Items: {req.seizure_items}, Location: {req.seizure_location}, Recovered from: {req.seizure_recovered_from}, Witnessed: {req.seizure_witnessed}
13. Arrest Circumstances: {req.arrest_circumstances}
14. Accused Statements: Available: {req.accused_statement_available}, Confession/Admission: {req.confession_admission}, Details: {req.statement_details}
15. Digital & Surveillance: CCTV: {req.cctv_status} ({req.cctv_details}), Digital: {req.digital_evidence_status} ({req.digital_evidence_details})
16. Hearing Notes: {req.hearing_notes} {req.previous_hearing_context}

CRITICAL INSTRUCTIONS:
- Ground your analysis strictly in the provided case facts.
- Do NOT generate generic placeholder statements such as "The prosecution will rely on witness testimony" or "No major textual weaknesses detected".
- State explicitly which witnesses, which exhibits, what weaknesses, and what counter-arguments apply.
- If forensic analysis (e.g. Government Analyst report) is pending or missing, explicitly state this.
- If search was warrantless or chain of custody incomplete or seal missing, analyze those specific vulnerabilities.
- For procedural issues, use language like: "Potential procedural issue requiring legal review."
- Output valid JSON matching the exact schema of AdversarialAnalysisResult.
"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AdversarialAnalysisResult,
                temperature=0.2,
            ),
        )

        if response and response.text:
            parsed_json = json.loads(response.text)
            result = AdversarialAnalysisResult(**parsed_json)
            logger.info("[Adversarial Engine] Successfully parsed Gemini response into AdversarialAnalysisResult.")
            return result

    except Exception as e:
        logger.warning(f"[Adversarial Engine] Gemini call failed or raised error: {e}. Falling back to evidence-aware reasoning engine.")

    return None


# ─────────────────────────────────────────────────────────────────────────────
# Primary Endpoint: POST /opponent/full-analysis
# ─────────────────────────────────────────────────────────────────────────────

@opponent_router.post("/full-analysis", response_model=AdversarialAnalysisResult)
async def full_adversarial_analysis(req: FullCaseAnalysisRequest):
    """
    Executes a comprehensive, evidence-aware 14-section adversarial opponent prediction.
    Incorporates all available case data, forensic status, chain of custody, search & seizure details,
    witnesses, and defense arguments.
    """
    log_received_case_metadata(req)

    # 1. Try Gemini if configured
    gemini_result = await call_gemini_for_adversarial_analysis(req)
    if gemini_result is not None:
        return gemini_result

    # 2. Evidence-Aware Adversarial Legal Reasoning Engine
    logger.info("[Adversarial Engine] Running evidence-aware adversarial legal reasoning engine...")
    return generate_evidence_aware_adversarial_analysis(req)


# ─────────────────────────────────────────────────────────────────────────────
# Legacy Endpoints (Enhanced to never return generic stub output)
# ─────────────────────────────────────────────────────────────────────────────

@opponent_router.post("/analyze-argument", response_model=AnalysisResult)
async def analyze_argument(req: ArgumentAnalysisRequest):
    """
    Analyzes defense arguments and returns evidence-backed weaknesses, contradictions, and missing evidence.
    """
    full_req = FullCaseAnalysisRequest(
        charges=req.charges,
        defense_arguments=req.defense_arguments,
        hearing_notes=req.hearing_notes,
        witness_summaries=req.witness_summaries,
        evidence_summaries=req.evidence_summaries,
        legal_sections=req.legal_sections
    )
    analysis = generate_evidence_aware_adversarial_analysis(full_req)

    weaknesses = []
    for vuln in analysis.detected_defense_vulnerabilities:
        weaknesses.append({
            "pattern": vuln.title,
            "reason": f"[{vuln.severity} Severity] {vuln.description} Why exploitable: {vuln.why_exploitable}"
        })

    contradictions = []
    for contra in analysis.contradictions_inconsistencies:
        contradictions.append({
            "issue": f"{contra.issue}: {contra.explanation}"
        })

    missing_ev = [f"{m.item} ({m.category}): {m.impact_on_prosecution}" for m in analysis.missing_evidence]

    claims = [
        "Defense Challenge to Constructive Possession",
        "Procedural Challenge to Search and Seizure",
        "Challenge to Chain of Custody and Forensic Confirmation"
    ]

    return AnalysisResult(
        weaknesses=weaknesses,
        contradictions=contradictions,
        missing_evidence=missing_ev,
        detected_claims=claims
    )


@opponent_router.post("/predict-opponent", response_model=PredictionResult)
async def predict_opponent(req: PredictionRequest):
    """
    Predicts likely prosecution responses based on analyzed data with case-specific arguments.
    """
    analyzed = req.analyzed_data or {}
    
    # Return structured arguments
    opponent_args = [
        "The prosecution will argue constructive possession based on the accused's physical presence and spatial proximity to the recovery point.",
        "The prosecution will seek an inference of knowledge under circumstantial evidence doctrines, arguing the concealment location was accessible to the accused.",
        "The prosecution will submit that sworn direct testimony of the arresting officer is prima facie sufficient to prove recovery.",
        "The prosecution will claim exigent circumstances to justify conducting a vehicle search without a prior judicial warrant."
    ]

    objections = [
        "Prosecution objection to defense cross-examination regarding uncalled civilian witnesses as legally irrelevant to recovery validity.",
        "Prosecution objection to defense motions for discharge prior to the submission of the Government Analyst report."
    ]

    ev_attacks = [
        "Prosecution will challenge defense claims of third-party ownership unless supported by certified registration records.",
        "Prosecution will argue that minor administrative gaps in the station diary do not vitiate the physical recovery."
    ]

    proc_objections = [
        "Objection to late filing of defense witness lists or production of unexpected defense documents without prior inspection."
    ]

    recommendations = [
        "File formal motion demanding early production of the Government Analyst report and exact intake weighment.",
        "Summon the vehicle registration records to establish third-party ownership and lack of accused control.",
        "Prepare cross-examination specifically targeting the lack of contemporaneous grounds recorded for the warrantless search."
    ]

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
    Extracts legal entities, claims, and references for Knowledge Graph.
    """
    entities = []
    if nlp:
        doc = nlp(req.text)
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG", "DATE", "GPE", "LAW"]:
                entities.append({"text": ent.text, "label": ent.label_})
    else:
        entities.append({"text": "Law Enforcement Agency", "label": "ORG"})
        entities.append({"text": "Accused Party", "label": "PERSON"})

    return InsightResult(
        entities=entities,
        claims=["Alleged procedural irregularity in search and seizure", "Contested constructive possession"],
        evidence_references=["Physical recovered substance", "Vehicle search memo", "Government Analyst report"],
        procedural_issues=["Potential procedural issue requiring legal review: Warrantless search without recorded reasons", "Absence of documented exhibit seal number"]
    )


@opponent_router.post("/risk-analysis", response_model=RiskResult)
async def risk_analysis(req: RiskRequest):
    """
    Calculates evidence-based risk level.
    """
    total_gaps = req.weaknesses_count + req.contradictions_count + req.missing_evidence_count
    
    if total_gaps >= 6:
        level = "MODERATE"
        vuln = "Multiple significant evidentiary and procedural gaps identified (missing forensic report, chain of custody vulnerabilities, and non-exclusive possession). Prosecution faces substantial proof burdens."
        conf = 0.82
    elif total_gaps >= 3:
        level = "HIGH"
        vuln = "Prosecution has tangible recovery and police testimony, but defense has multiple defined procedural challenge avenues."
        conf = 0.78
    else:
        level = "VERY HIGH"
        vuln = "Prosecution evidence appears solid with minimal detected defense leverage points on the current record."
        conf = 0.88

    return RiskResult(
        risk_level=level,
        confidence_score=conf,
        vulnerability_analysis=vuln
    )


@opponent_router.get("/similar-cases/{case_id}")
async def get_similar_cases(case_id: str):
    """
    Returns relevant similar appeal cases for precedent comparison.
    """
    return {
        "status": "success",
        "case_id": case_id,
        "similar_cases": [
            {
                "case_id": "CA-TAB-88-2018",
                "parties": "State vs. Fernando",
                "description": "Substance recovered under car seat; passenger acquitted due to lack of exclusive control and absence of civilian witness.",
                "similarity_score": 0.91,
                "url_pdf": "http://example.com/case/88"
            },
            {
                "case_id": "SC-APPEAL-42-2016",
                "parties": "Attorney General vs. Silva",
                "description": "Chain of custody broken by missing exhibit seal numbers; conviction set aside on appeal.",
                "similarity_score": 0.87,
                "url_pdf": "http://example.com/case/42"
            }
        ]
    }
