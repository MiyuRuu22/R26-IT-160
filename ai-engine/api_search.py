"""
api_search.py
=============
FastAPI application exposing two semantic search endpoints:

  POST /search        -> Classified + filtered semantic search over legal statutes (CSV-based)
  POST /search-cases  -> Semantic search over appeal court judgements (TSV-based)

Search Pipeline for /search (NEW)
----------------------------------
1. Classify the user query into a fine-grained legal issue category
   (e.g. "drug_offense") using legal_classifier.py
2. Filter the in-memory law metadata to only rows whose `category`
   column matches the classifier's `allowed_categories`
3. Reconstruct only those FAISS vectors into a temporary sub-index
4. Run cosine-similarity search on the sub-index
5. Return results enriched with classification metadata

Fallback: if the filtered corpus is too small (< MIN_FILTER_SIZE) or
confidence is below threshold, search the full corpus.

Run:
    py -m uvicorn api_search:app --reload --host 0.0.0.0 --port 8000
"""

import os
import pickle
import logging

import faiss
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from typing import List, Optional

from config import Config
from legal_classifier import classify_legal_issue, ClassificationResult
from opponent_engine import opponent_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("api_search")

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Minimum number of laws in the filtered sub-corpus to trust the filter.
# If fewer than this, fall back to full-corpus search.
MIN_FILTER_SIZE = 10

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Lawyer AI Engine",
    description=(
        "Classified + filtered semantic search: legal statutes (/search) "
        "and appeal court precedents (/search-cases)."
    ),
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(opponent_router, prefix="/opponent")


# ── Global state ──────────────────────────────────────────────────────────────
_model:          Optional[SentenceTransformer] = None

# Laws
_law_index:    Optional[faiss.Index] = None
_law_metadata: List[dict]            = []

# Cases
_case_index:    Optional[faiss.Index] = None
_case_metadata: List[dict]            = []


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event() -> None:
    global _model, _law_index, _law_metadata, _case_index, _case_metadata

    logger.info("Loading shared embedding model ...")
    _model = SentenceTransformer(Config.MODEL_NAME)

    # ── Load laws index ───────────────────────────────────────────────────────
    if os.path.exists(Config.FAISS_INDEX_PATH):
        logger.info("Loading laws FAISS index ...")
        _law_index = faiss.read_index(Config.FAISS_INDEX_PATH)
        with open(Config.METADATA_PATH, "rb") as f:
            _law_metadata = pickle.load(f)
        logger.info(f"Laws ready: {_law_index.ntotal:,} vectors | {len(_law_metadata):,} records")
    else:
        logger.warning("Laws index not found. Run  python embedder.py  first.")

    # ── Load cases index ──────────────────────────────────────────────────────
    if os.path.exists(Config.CASE_FAISS_INDEX_PATH):
        logger.info("Loading cases FAISS index ...")
        _case_index = faiss.read_index(Config.CASE_FAISS_INDEX_PATH)
        with open(Config.CASE_METADATA_PATH, "rb") as f:
            _case_metadata = pickle.load(f)
        logger.info(f"Cases ready: {_case_index.ntotal:,} chunks | {len(_case_metadata):,} records")
    else:
        logger.warning("Cases index not found. Run  python case_embedder.py  first.")

    logger.info("API startup complete.")


# ── Helpers ───────────────────────────────────────────────────────────────────
def _embed(text: str) -> np.ndarray:
    """Encode text and L2-normalise for cosine similarity."""
    vec = _model.encode([text], convert_to_numpy=True).astype("float32")
    faiss.normalize_L2(vec)
    return vec


def _build_sub_index(
    global_indices: List[int],
) -> Optional[tuple[faiss.Index, List[int]]]:
    """
    Build a temporary FAISS sub-index from a subset of the full law index.

    Parameters
    ----------
    global_indices : List[int]
        Positions in _law_index / _law_metadata to include.

    Returns
    -------
    (sub_index, global_indices_ordered) or None if reconstruction fails.
    sub_index vectors correspond 1-to-1 with global_indices_ordered.
    """
    if not global_indices or _law_index is None:
        return None

    try:
        # Reconstruct all vectors for the selected indices
        dim = _law_index.d
        sub_vectors = np.zeros((len(global_indices), dim), dtype="float32")
        for local_i, global_i in enumerate(global_indices):
            _law_index.reconstruct(global_i, sub_vectors[local_i])

        # Build a fresh inner-product index (vectors are already L2-normalised)
        sub_index = faiss.IndexFlatIP(dim)
        sub_index.add(sub_vectors)
        return sub_index, global_indices
    except Exception as exc:
        logger.warning(f"Sub-index reconstruction failed: {exc}. Falling back to full corpus.")
        return None


def _filter_law_indices(allowed_categories: List[str]) -> List[int]:
    """
    Return the global FAISS indices of laws whose `category` is in
    `allowed_categories`.
    """
    return [
        idx for idx, rec in enumerate(_law_metadata)
        if rec.get("category", "unknown") in allowed_categories
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# LAWS ENDPOINT  —  /search
# ═══════════════════════════════════════════════════════════════════════════════

class LawSearchRequest(BaseModel):
    question:     str           = Field(..., min_length=1, example="drug trafficking criminal conspiracy")
    top_k:        int           = Field(default=Config.TOP_K_RESULTS, ge=1, le=20)
    # Optional overrides — if provided, bypass classifier
    category:     Optional[str] = Field(default=None, example="Criminal Law")
    legal_system: Optional[str] = Field(default=None, example="Sri Lanka")


class LawResult(BaseModel):
    act_name:         str
    act_no:           str
    section:          str
    section_title:    str
    category:         str
    subcategory:      str
    legal_system:     str
    law_text:         str
    similarity_score: float


class LawSearchResponse(BaseModel):
    status:              str
    query:               str
    total_results:       int
    # Classification metadata (new)
    detected_case_type:  str
    detected_label:      str
    confidence:          float
    filtered_category:   str
    laws_in_filter:      int
    search_mode:         str        # "filtered" | "full_corpus"
    matched_keywords:    List[str]
    results:             List[LawResult]


@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "model": Config.MODEL_NAME,
        "laws_index_vectors":  _law_index.ntotal  if _law_index  else 0,
        "cases_index_vectors": _case_index.ntotal if _case_index else 0,
        "version": "4.0.0",
    }


@app.post("/search", response_model=LawSearchResponse, tags=["Laws"])
async def search_laws(req: LawSearchRequest):
    """
    Classified + filtered semantic search over Sri Lankan legal statutes.

    Pipeline:
    1. Classify the query into a legal issue category.
    2. Filter the law corpus to matching categories.
    3. Run semantic search on the filtered sub-corpus.
    4. Fall back to full-corpus search if filter is too narrow.
    """
    if not _model or not _law_index or not _law_metadata:
        raise HTTPException(503, detail=(
            "Laws index not initialised. Run  python embedder.py  then restart."
        ))

    question = req.question.strip()
    if not question:
        raise HTTPException(400, detail="question must not be empty.")

    try:
        logger.info(f"/search  query='{question}'")

        # ── Step 1: Classify the legal issue ─────────────────────────────────
        classification: ClassificationResult = classify_legal_issue(question)
        logger.info(
            f"/search  classified as '{classification['issue']}' "
            f"(conf={classification['confidence']:.3f}, "
            f"cats={classification['allowed_categories']})"
        )

        # ── Step 2: Filter law metadata by allowed categories ─────────────────
        allowed_cats = classification["allowed_categories"]
        filtered_indices = _filter_law_indices(allowed_cats)
        laws_in_filter = len(filtered_indices)

        logger.info(f"/search  filtered corpus size: {laws_in_filter}")

        # ── Step 3: Decide search mode ────────────────────────────────────────
        search_mode = "filtered"
        working_index: Optional[faiss.Index] = None
        index_map: List[int] = []           # local_idx → global_idx

        if laws_in_filter >= MIN_FILTER_SIZE and not classification["fallback"]:
            result = _build_sub_index(filtered_indices)
            if result is not None:
                working_index, index_map = result
                logger.info(f"/search  using sub-index with {len(index_map)} laws")
            else:
                search_mode = "full_corpus"
        else:
            search_mode = "full_corpus"
            logger.info("/search  using full corpus (filter too small or fallback)")

        if search_mode == "full_corpus":
            working_index = _law_index
            index_map = list(range(len(_law_metadata)))

        # ── Step 4: Embed query and search ────────────────────────────────────
        vec = _embed(question)
        fetch_k = min(req.top_k * 10, working_index.ntotal)
        scores, local_indices = working_index.search(vec, fetch_k)

        # ── Step 5: Build results ─────────────────────────────────────────────
        results: List[LawResult] = []
        seen_acts = set()   # de-duplicate by (act_name, section)

        for rank in range(len(local_indices[0])):
            local_idx = int(local_indices[0][rank])
            score     = float(scores[0][rank])

            if local_idx < 0 or local_idx >= len(index_map):
                continue

            global_idx = index_map[local_idx]
            if global_idx >= len(_law_metadata):
                continue

            rec = _law_metadata[global_idx]

            # Optional manual category/legal_system filter (kept for backwards compat)
            if req.category and req.category.lower() not in rec.get("category", "").lower():
                continue
            if req.legal_system and req.legal_system.lower() not in rec.get("legal_system", "").lower():
                continue

            # De-duplicate identical act+section combos
            dedup_key = (rec.get("act_name", ""), rec.get("section", ""))
            if dedup_key in seen_acts:
                continue
            seen_acts.add(dedup_key)

            results.append(LawResult(
                act_name=rec.get("act_name", ""),
                act_no=rec.get("act_no", ""),
                section=rec.get("section", ""),
                section_title=rec.get("section_title", ""),
                category=rec.get("category", ""),
                subcategory=rec.get("subcategory", ""),
                legal_system=rec.get("legal_system", ""),
                law_text=rec.get("law_text", ""),
                similarity_score=round(score, 4),
            ))

            if len(results) >= req.top_k:
                break

        logger.info(
            f"/search  returning {len(results)} results "
            f"(mode={search_mode}, issue={classification['issue']})"
        )

        return LawSearchResponse(
            status="success",
            query=question,
            total_results=len(results),
            detected_case_type=classification["issue"],
            detected_label=classification["issue_label"],
            confidence=classification["confidence"],
            filtered_category=", ".join(allowed_cats),
            laws_in_filter=laws_in_filter,
            search_mode=search_mode,
            matched_keywords=classification["matched_keywords"],
            results=results,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"/search error: {exc}")
        raise HTTPException(500, detail="Internal search error.")


# ═══════════════════════════════════════════════════════════════════════════════
# CASES ENDPOINT  —  /search-cases
# ═══════════════════════════════════════════════════════════════════════════════

class CaseSearchRequest(BaseModel):
    question: str = Field(..., min_length=1, example="financial fraud involving forged documents")
    top_k:    int = Field(default=Config.TOP_K_RESULTS, ge=1, le=20)


class CaseResult(BaseModel):
    filename:         str
    case_id:          str
    chunk_text:       str
    parties:          str
    description:      str
    judgement_by:     str
    keywords:         str
    legistation:      str
    num:              str
    date_str:         str
    url_pdf:          str
    similarity_score: float


class CaseSearchResponse(BaseModel):
    status:        str
    query:         str
    total_results: int
    similar_cases: List[CaseResult]


@app.post("/search-cases", response_model=CaseSearchResponse, tags=["Cases"])
async def search_cases(req: CaseSearchRequest):
    """
    Semantic search over Sri Lankan Appeal Court judgements.
    Returns top-K most semantically similar case chunks with full metadata.
    Designed for precedent retrieval and legal defense assistance.
    """
    if not _model or not _case_index or not _case_metadata:
        raise HTTPException(503, detail=(
            "Cases index not initialised. Run  python case_embedder.py  then restart."
        ))

    question = req.question.strip()
    if not question:
        raise HTTPException(400, detail="question must not be empty.")

    try:
        logger.info(f"/search-cases  query='{question}'")
        vec = _embed(question)

        fetch_k = min(req.top_k * 10, len(_case_metadata))
        scores, indices = _case_index.search(vec, fetch_k)

        # De-duplicate by case_id (return best chunk per case)
        seen_cases: set = set()
        results: List[CaseResult] = []

        for rank in range(len(indices[0])):
            idx   = int(indices[0][rank])
            score = float(scores[0][rank])
            if idx < 0 or idx >= len(_case_metadata):
                continue

            chunk = _case_metadata[idx]
            case_id = chunk.get("case_id", "")

            if case_id in seen_cases:
                continue
            seen_cases.add(case_id)

            results.append(CaseResult(
                filename=chunk.get("filename", ""),
                case_id=case_id,
                chunk_text=chunk.get("chunk_text", ""),
                parties=chunk.get("parties", ""),
                description=chunk.get("description", ""),
                judgement_by=chunk.get("judgement_by", ""),
                keywords=chunk.get("keywords", ""),
                legistation=chunk.get("legistation", ""),
                num=chunk.get("num", ""),
                date_str=chunk.get("date_str", ""),
                url_pdf=chunk.get("url_pdf", ""),
                similarity_score=round(score, 4),
            ))

            if len(results) >= req.top_k:
                break

        logger.info(f"/search-cases  returning {len(results)} results")
        return CaseSearchResponse(
            status="success",
            query=question,
            total_results=len(results),
            similar_cases=results,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"/search-cases error: {exc}")
        raise HTTPException(500, detail="Internal search error.")


# ── Dev entry-point ───────────────────────────────────────────────────────────

# ═══════════════════════════════════════════════════════════════════════════════
# DEFENSE ANALYZER ENDPOINT  —  /analyze
# ═══════════════════════════════════════════════════════════════════════════════

# ── NLP Knowledge Base (inline, mirrors b_report_analysis.py) ─────────────────

WEAK_WORD_PATTERNS = {
    "suspected":           "The allegation is based on suspicion rather than proven fact.",
    "allegedly":           "This claim is alleged, not established — the burden of proof remains with the prosecution.",
    "believed to":         "The prosecution relies on belief, not evidence — mere belief cannot substitute for proof beyond reasonable doubt.",
    "possibly":            "Possibility is not proof. The prosecution must establish guilt to a certainty, not a possibility.",
    "connected to":        "A connection does not establish criminal liability without direct evidence of participation.",
    "linked to":           "Being linked to a person or event does not constitute criminal guilt without corroborating evidence.",
    "may have":            "Speculative language ('may have') is insufficient to establish the required standard of proof.",
    "thought to be":       "A mere assumption is not evidence and cannot ground a criminal conviction.",
    "appears to":          "Appearance is not a legal standard. The prosecution must prove facts, not appearances.",
    "presumed":            "A presumption without supporting evidence violates the accused's right to be presumed innocent.",
    "reported to have":    "Unverified reports cannot substitute for direct evidence in a criminal prosecution.",
    "it is alleged":       "An allegation without factual substantiation is legally insufficient.",
    "according to sources":"Anonymous or unidentified sources cannot be used as evidence against an accused person.",
    "informants":          "Information from undisclosed informants lacks the reliability required for criminal prosecution.",
    "tip-off":             "A tip-off without corroborating evidence is inherently unreliable.",
    "associated with":     "Mere association with a person or group does not establish criminal liability.",
}

MISSING_EVIDENCE_BY_TYPE = {
    "drug_offense": [
        {"label": "Lab / Government Analyst Report", "hint": "lab report|government analyst|analyst report"},
        {"label": "Forensic Report", "hint": "forensic report"},
        {"label": "Chain of Custody", "hint": "chain of custody"},
        {"label": "Phone Extraction", "hint": "phone extraction|digital forensic|mobile forensic"},
    ],
    "forgery": [
        {"label": "Handwriting Analysis", "hint": "handwriting analysis|document examiner"},
        {"label": "Signature Verification", "hint": "signature verif|signature expert"},
        {"label": "Document Expert Report", "hint": "document expert|forensic document"},
    ],
    "assault": [
        {"label": "Medical Report", "hint": "medical report|hospital report|injury report"},
        {"label": "Autopsy / Post-Mortem Report", "hint": "autopsy|post-mortem|post mortem"},
        {"label": "Independent Witness Statement", "hint": "independent witness|eye witness|eyewitness"},
    ],
    "financial_fraud": [
        {"label": "Bank Records / Statements", "hint": "bank record|bank statement|financial statement"},
        {"label": "Audit Report", "hint": "audit report|auditor"},
        {"label": "Transaction Records", "hint": "transaction record|transfer record"},
    ],
    "murder": [
        {"label": "Post-Mortem Report", "hint": "post-mortem|autopsy"},
        {"label": "Ballistic / Forensic Report", "hint": "ballistic|forensic report"},
        {"label": "CCTV / Video Evidence", "hint": "cctv|video footage|surveillance"},
    ],
    "general": [
        {"label": "Forensic Evidence", "hint": "forensic"},
        {"label": "Independent Witness", "hint": "independent witness|eyewitness"},
        {"label": "CCTV / Surveillance", "hint": "cctv|surveillance"},
    ],
}

CONTRADICTION_PATTERNS_RE = [
    (r"(\d{1,2}[:\.\s]\d{2}\s*(am|pm|hours?)?)", "Timeline Reference"),
    (r"\b(first|initial|original)\s+statement\b.*?\b(later|subsequent|revised|changed)\b", "Statement Change"),
    (r"\bbut\s+(then|later|subsequently|however)\b", "Narrative Contradiction"),
    (r"\b(contradicts?|conflicts?\s+with|inconsistent\s+with)\b", "Explicit Contradiction"),
    (r"\b(arrest(?:ed)?\s+at\s+\d{1,2}[:.]\d{2})\b.*?\b(arrived?\s+at\s+\d{1,2}[:.]\d{2})\b", "Arrest/Arrival Conflict"),
]

DEFENSE_STRATEGIES = {
    "drug_offense": [
        "Challenge the chain of custody — any break renders evidence inadmissible.",
        "Request the Government Analyst Report; absence is fatal to the prosecution.",
        "Challenge whether the search was conducted lawfully under the Dangerous Drugs Ordinance.",
        "Question the arresting officers on the exact procedure used at seizure.",
    ],
    "forgery": [
        "Demand a court-appointed handwriting expert to independently verify the alleged forgery.",
        "Challenge the authentication of the impugned documents.",
        "Examine whether the accused had access to the materials used in the alleged forgery.",
    ],
    "assault": [
        "Challenge the medical report — obtain an independent medical opinion.",
        "Cross-examine on contradictions between witness statements.",
        "Raise the defence of self-defence or provocation where applicable.",
    ],
    "financial_fraud": [
        "Demand full disclosure of all financial records from the prosecution.",
        "Challenge the forensic accounting methodology used.",
        "Examine whether required audit procedures were followed.",
    ],
    "murder": [
        "Challenge the post-mortem findings with an independent pathologist.",
        "Examine alibi evidence and inconsistencies in the prosecution timeline.",
        "Question eyewitness identification procedures.",
    ],
    "general": [
        "Challenge evidentiary sufficiency — file a No Case to Answer motion.",
        "Question absence of forensic proof.",
        "Examine all witness statements for inconsistencies.",
        "Apply for bail citing weakness of the prosecution's case.",
    ],
}

RISK_LABELS = {
    "LOW":       "Low Prosecution Risk",
    "MEDIUM":    "Moderate Prosecution Risk",
    "HIGH":      "High Prosecution Risk",
    "VERY HIGH": "Very High Prosecution Risk",
}

import re as _re


def _find_sentence(text: str, keyword: str) -> str:
    sentences = _re.split(r'(?<=[.!?])\s+', text)
    for s in sentences:
        if keyword.lower() in s.lower():
            return s.strip()[:300]
    idx = text.lower().find(keyword.lower())
    if idx == -1:
        return ""
    return text[max(0, idx - 80): min(len(text), idx + 200)].strip()


def _detect_weak_words(text: str) -> list:
    results = []
    text_lower = text.lower()
    for keyword, argument in WEAK_WORD_PATTERNS.items():
        if keyword in text_lower:
            results.append({
                "detected_word":     keyword,
                "original_sentence": _find_sentence(text, keyword),
                "defense_argument":  argument,
            })
    return results


def _detect_missing_evidence(text: str, issue_key: str) -> list:
    text_lower = text.lower()
    patterns = MISSING_EVIDENCE_BY_TYPE.get(issue_key, MISSING_EVIDENCE_BY_TYPE["general"])
    results = []
    for item in patterns:
        found = any(h in text_lower for h in item["hint"].split("|"))
        if not found:
            results.append({
                "label":            item["label"],
                "defense_argument": f"No {item['label']} was found in the case facts. This is a critical gap in the prosecution's evidence.",
            })
    return results


def _detect_contradictions(text: str) -> list:
    results = []
    for pattern, label in CONTRADICTION_PATTERNS_RE:
        matches = _re.findall(pattern, text, _re.IGNORECASE)
        if matches:
            first = matches[0] if isinstance(matches[0], str) else matches[0][0]
            results.append({
                "type":    label,
                "detected": str(first)[:200],
                "context": _find_sentence(text, first),
                "argument": "This inconsistency in the prosecution's narrative creates reasonable doubt that must benefit the accused.",
            })
    return results


def _calculate_risk(weak_words: list, missing_evidence: list, contradictions: list) -> str:
    score = len(weak_words) * 2 + len(missing_evidence) * 3 + len(contradictions) * 2
    if score >= 15:
        return "LOW"
    elif score >= 8:
        return "MEDIUM"
    elif score >= 3:
        return "HIGH"
    return "VERY HIGH"


def _get_defense_strategies(issue_key: str) -> list:
    strategies = DEFENSE_STRATEGIES.get(issue_key, DEFENSE_STRATEGIES["general"])
    return strategies


def _detect_advanced_red_flags(text: str, issue_key: str) -> list:
    flags = []
    text_lower = text.lower()
    
    # 1. Delayed FIR
    if _re.search(r'\b(delay(ed)?\s+(in\s+)?(fir|complaint|reporting|statement)|after\s+\d+\s+(days|hours|weeks))\b', text_lower):
        flags.append({
            "title": "Delayed FIR",
            "description": "A delay in lodging the FIR or complaint was detected.",
            "defense_tip": "If there is a gap of more than 24–48 hours without a valid reason, argue 'Fabrication Risk' to suggest the story was concocted later."
        })
        
    # 2. Rank of Officer
    if issue_key in ["drug_offense"] and _re.search(r'\barrested\s+by\s+(pc|police\s+constable|constable)\b', text_lower):
        flags.append({
            "title": "Rank of Officer",
            "description": "Arrest or search conducted by a low-ranking officer (e.g., Police Constable).",
            "defense_tip": "Certain offenses require a minimum rank (e.g., SI or above) to conduct a valid search. Flag as 'Illegal Search/Arrest'."
        })
        
    # 3. A1 to A2 Consistency
    if _re.search(r'\b(a1|1st suspect|first suspect)\b', text_lower) and _re.search(r'\b(a2|2nd suspect|second suspect)\b', text_lower):
        if _re.search(r'\b(was\s+present|standing|accompanied)\b', text_lower):
            flags.append({
                "title": "A1 to A2 Consistency (Misjoinder)",
                "description": "Multiple suspects detected with passive roles mentioned (e.g., 'being present').",
                "defense_tip": "If Suspect 02 is only mentioned as 'being present', flag a 'Misjoinder of Accused' to get them discharged early for lack of specific evidence."
            })
            
    # 4. Recovery in Presence
    if _re.search(r'\b(found|recovered|seized|discovered)\b', text_lower) and not _re.search(r'\b(independent witness|civilian|public witness)\b', text_lower):
        flags.append({
            "title": "Recovery in Presence",
            "description": "Evidence was recovered, but no independent/civilian witnesses are mentioned.",
            "defense_tip": "Flag 'Police Planting Risk'. Evidence found only in the presence of police officers is much weaker in court."
        })
        
    # 5. Digital Evidence "Missing Link"
    if _re.search(r'\b(phone|mobile|laptop|computer|device)\b', text_lower):
        if not _re.search(r'\b(hash\s+value|sealed|sealing)\b', text_lower):
            flags.append({
                "title": "Digital Evidence 'Missing Link'",
                "description": "Digital devices (phone/laptop) are mentioned, but no hash value or sealing procedure is noted.",
                "defense_tip": "Flag 'Data Tampering Opportunity'. If police didn't seal the device properly, this is a huge win for the defense."
            })
            
    # 6. Identifiable vs. Named
    if _re.search(r'\b(unknown|unidentified)\s+(person|man|individual)\b', text_lower) and not _re.search(r'\b(id\s+parade|identification\s+parade)\b', text_lower):
        flags.append({
            "title": "Identifiable vs. Named Gap",
            "description": "An initially 'unknown person' is mentioned without a subsequent ID Parade.",
            "defense_tip": "Flag 'Identity Error'. Suggests the police might have 'coached' the informant to name the suspect later."
        })
        
    # 7. Non-Cognizable Trap
    if _re.search(r'\b(non-cognizable|non\s+cognizable)\b', text_lower) and _re.search(r'\barrest(ed)?\b', text_lower):
        flags.append({
            "title": "Non-Cognizable Trap",
            "description": "An arrest was made for what may be a non-cognizable offense.",
            "defense_tip": "Flag 'Ultra Vires (Beyond Authority) Arrest'. If police arrested without a warrant for a minor offense, the entire case could be thrown out."
        })
        
    # 8. Forensic Silence
    if issue_key in ["assault", "murder", "drug_offense"] and _re.search(r'\b(blood|dna|fingerprint|handwriting|drugs?|narcotics?)\b', text_lower):
        if not _re.search(r'\b(government\s+analyst|ga\s+report|forensic\s+expert|analyst)\b', text_lower):
            flags.append({
                "title": "Forensic Silence",
                "description": "Physical contact or trace evidence is mentioned, but no Government Analyst (GA) report was requested.",
                "defense_tip": "Flag 'Failure to Collect Scientific Evidence'. This creates 'Reasonable Doubt'."
            })
            
    return flags


# ── Pydantic Models ───────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    case_type:       str = Field(default="Criminal", example="Criminal")
    legal_issue:     str = Field(..., min_length=1, example="drug trafficking")
    facts:           str = Field(default="", example="The accused was allegedly found in possession of 5g heroin...")
    desired_outcome: str = Field(default="Acquittal", example="Acquittal")
    top_k:           int = Field(default=5, ge=1, le=10)


class WeakWordItem(BaseModel):
    detected_word:     str
    original_sentence: str
    defense_argument:  str


class MissingEvidenceItem(BaseModel):
    label:            str
    defense_argument: str


class ContradictionItem(BaseModel):
    type:     str
    detected: str
    context:  str
    argument: str


class RedFlagItem(BaseModel):
    title:       str
    description: str
    defense_tip: str


class DefenseCaseResult(BaseModel):
    case_id:          str
    parties:          str
    description:      str
    keywords:         str
    date_str:         str
    url_pdf:          str
    similarity_score: float


class DefenseAnalysisResponse(BaseModel):
    status:               str
    detected_issue:       str
    detected_label:       str
    confidence:           float
    search_mode:          str
    laws_in_filter:       int
    filtered_category:    str
    matched_keywords:     List[str]
    # Defense analysis
    weak_wording:         List[WeakWordItem]
    missing_evidence:     List[MissingEvidenceItem]
    contradictions:       List[ContradictionItem]
    defense_considerations: List[str]
    advanced_red_flags:   List[RedFlagItem]
    risk_level:           str
    risk_label:           str
    # Similarity results
    similar_laws:         List[LawResult]
    similar_cases:        List[DefenseCaseResult]


@app.post("/analyze", response_model=DefenseAnalysisResponse, tags=["Defense Analyzer"])
async def analyze_case(req: AnalyzeRequest):
    """
    Defense Analysis Engine — Phase 3 of the AntiGravity implementation plan.

    Accepts: case_type, legal_issue, facts, desired_outcome
    Returns: weak wording, missing evidence, contradictions, defense strategies,
             similar laws, similar cases, risk level.
    """
    if not _model:
        raise HTTPException(503, detail="AI model not ready. Restart the server.")

    legal_issue = req.legal_issue.strip()
    facts = req.facts.strip()
    combined_query = f"{legal_issue}. {facts}"[:1000]

    try:
        logger.info(f"/analyze  issue='{legal_issue}' type='{req.case_type}'")

        # ── Step 1: Classify the legal issue ──────────────────────────────────
        classification: ClassificationResult = classify_legal_issue(combined_query)
        issue_key = classification["issue"]
        logger.info(f"/analyze  classified as '{issue_key}' conf={classification['confidence']:.3f}")

        # ── Step 2: Run NLP analysis on the facts text ────────────────────────
        full_text = f"{legal_issue} {facts}"
        weak_words       = _detect_weak_words(full_text)
        missing_evidence = _detect_missing_evidence(full_text, issue_key)
        contradictions   = _detect_contradictions(full_text)
        red_flags        = _detect_advanced_red_flags(full_text, issue_key)
        risk             = _calculate_risk(weak_words, missing_evidence, contradictions)
        defense_strats   = _get_defense_strategies(issue_key)

        # ── Step 3: Semantic law search (filtered) ────────────────────────────
        similar_laws: List[LawResult] = []
        laws_in_filter = 0
        search_mode = "full_corpus"

        if _law_index and _law_metadata:
            allowed_cats = classification["allowed_categories"]
            filtered_indices = _filter_law_indices(allowed_cats)
            laws_in_filter = len(filtered_indices)

            working_index = _law_index
            index_map = list(range(len(_law_metadata)))

            if laws_in_filter >= MIN_FILTER_SIZE and not classification["fallback"]:
                result = _build_sub_index(filtered_indices)
                if result is not None:
                    working_index, index_map = result
                    search_mode = "filtered"

            vec = _embed(combined_query)
            fetch_k = min(req.top_k * 5, working_index.ntotal)
            scores, local_indices = working_index.search(vec, fetch_k)

            seen_acts = set()
            for rank in range(len(local_indices[0])):
                local_idx = int(local_indices[0][rank])
                score = float(scores[0][rank])
                if local_idx < 0 or local_idx >= len(index_map):
                    continue
                global_idx = index_map[local_idx]
                if global_idx >= len(_law_metadata):
                    continue
                rec = _law_metadata[global_idx]
                dedup_key = (rec.get("act_name", ""), rec.get("section", ""))
                if dedup_key in seen_acts:
                    continue
                seen_acts.add(dedup_key)
                similar_laws.append(LawResult(
                    act_name=rec.get("act_name", ""),
                    act_no=rec.get("act_no", ""),
                    section=rec.get("section", ""),
                    section_title=rec.get("section_title", ""),
                    category=rec.get("category", ""),
                    subcategory=rec.get("subcategory", ""),
                    legal_system=rec.get("legal_system", ""),
                    law_text=rec.get("law_text", ""),
                    similarity_score=round(score, 4),
                ))
                if len(similar_laws) >= req.top_k:
                    break

        # ── Step 4: Semantic case search ──────────────────────────────────────
        similar_cases: List[DefenseCaseResult] = []

        if _case_index and _case_metadata:
            vec2 = _embed(combined_query)
            fetch_k2 = min(req.top_k * 5, len(_case_metadata))
            scores2, indices2 = _case_index.search(vec2, fetch_k2)

            seen_cases: set = set()
            for rank in range(len(indices2[0])):
                idx = int(indices2[0][rank])
                score = float(scores2[0][rank])
                if idx < 0 or idx >= len(_case_metadata):
                    continue
                chunk = _case_metadata[idx]
                case_id = chunk.get("case_id", "")
                if case_id in seen_cases:
                    continue
                seen_cases.add(case_id)
                similar_cases.append(DefenseCaseResult(
                    case_id=case_id,
                    parties=chunk.get("parties", ""),
                    description=chunk.get("description", ""),
                    keywords=chunk.get("keywords", ""),
                    date_str=chunk.get("date_str", ""),
                    url_pdf=chunk.get("url_pdf", ""),
                    similarity_score=round(score, 4),
                ))
                if len(similar_cases) >= req.top_k:
                    break

        logger.info(
            f"/analyze  done | risk={risk} weak={len(weak_words)} "
            f"missing={len(missing_evidence)} contradictions={len(contradictions)} "
            f"laws={len(similar_laws)} cases={len(similar_cases)}"
        )

        return DefenseAnalysisResponse(
            status="success",
            detected_issue=classification["issue"],
            detected_label=classification["issue_label"],
            confidence=classification["confidence"],
            search_mode=search_mode,
            laws_in_filter=laws_in_filter,
            filtered_category=", ".join(classification["allowed_categories"]),
            matched_keywords=classification["matched_keywords"],
            weak_wording=[WeakWordItem(**w) for w in weak_words],
            missing_evidence=[MissingEvidenceItem(**m) for m in missing_evidence],
            contradictions=[ContradictionItem(**c) for c in contradictions],
            defense_considerations=defense_strats,
            advanced_red_flags=[RedFlagItem(**r) for r in red_flags],
            risk_level=risk,
            risk_label=RISK_LABELS[risk],
            similar_laws=similar_laws,
            similar_cases=similar_cases,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"/analyze error: {exc}")
        raise HTTPException(500, detail="Defense analysis failed.")


# ── Dev entry-point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_search:app", host="0.0.0.0", port=8000, reload=True)

