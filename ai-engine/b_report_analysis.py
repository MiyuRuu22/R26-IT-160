"""
b_report_analysis.py
====================
FastAPI endpoint for Sri Lankan B-Report Defense Analysis.

Endpoint:
  POST /analyze-b-report  — accepts PDF, returns full structured legal analysis

Pipeline:
  1. PDF text extraction (PyMuPDF → OCR fallback via pdfplumber/pytesseract)
  2. Legal NLP analysis (weak words, missing evidence, contradictions, entities)
  3. Defense argument generation with exact sentence citations
  4. Sinhala legal analysis via Google Gemini
  5. Risk scoring and recommendation generation

Run alongside the main api_search.py server, or as a separate service on port 8001:
  py -m uvicorn b_report_analysis:app --reload --host 0.0.0.0 --port 8001
"""

import os
import re
import io
import json
import logging
import tempfile
from typing import Optional

import fitz                        # PyMuPDF
import pdfplumber
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# ── Optional: Gemini for Sinhala generation ────────────────────────────────────
try:
    from google import genai as genai_client
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_AVAILABLE = bool(GEMINI_API_KEY)
except ImportError:
    GEMINI_AVAILABLE = False
    genai_client = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("b_report_analysis")

app = FastAPI(
    title="B-Report Defense Analysis Engine",
    description="AI-powered Sri Lankan B-Report legal defense analysis system.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════════════════════════════════════════════════════════
# NLP KNOWLEDGE BASE
# ══════════════════════════════════════════════════════════════════════════════

WEAK_WORD_PATTERNS = {
    "suspected":          "The allegation is based on suspicion rather than proven fact.",
    "allegedly":          "This claim is alleged, not established — the burden of proof remains with the prosecution.",
    "believed to":        "The prosecution relies on belief, not evidence — mere belief cannot substitute for proof beyond reasonable doubt.",
    "possibly":           "Possibility is not proof. The prosecution must establish guilt to a certainty, not a possibility.",
    "connected to":       "A connection or association does not establish criminal liability without direct evidence of participation.",
    "linked to":          "Being linked to a person or event does not constitute criminal guilt without corroborating evidence.",
    "may have":           "Speculative language ('may have') is insufficient to establish the required standard of proof.",
    "thought to be":      "A mere assumption or thought is not evidence and cannot ground a criminal conviction.",
    "appears to":         "Appearance is not a legal standard. The prosecution must prove facts, not appearances.",
    "presumed":           "A presumption without supporting evidence violates the accused's right to be presumed innocent.",
    "reported to have":   "Unverified reports cannot substitute for direct evidence in a criminal prosecution.",
    "it is alleged":      "An allegation without factual substantiation is legally insufficient.",
    "according to sources": "Anonymous or unidentified sources cannot be used as evidence against an accused person.",
    "informants":         "Information from undisclosed informants lacks the reliability required for criminal prosecution.",
    "tip-off":            "A tip-off without corroborating evidence is inherently unreliable and insufficient for conviction.",
}

MISSING_EVIDENCE_PATTERNS = {
    r"\bno\s+(forensic|scientific)\s+(evidence|report|analysis|test)\b": {
        "label": "No Forensic Evidence",
        "argument": "The absence of forensic or scientific evidence is a critical gap in the prosecution's case. Scientific evidence is fundamental to establishing guilt beyond reasonable doubt.",
    },
    r"\bno\s+witness(es|s)?\b|\bno\s+eye[- ]?witness\b": {
        "label": "No Eyewitness",
        "argument": "No witness testimony has been presented directly linking the accused to the alleged offense. The prosecution's case rests entirely on circumstantial grounds.",
    },
    r"\bno\s+cctv\b|\bno\s+surveillance\b|\bno\s+video\s+(footage|evidence|recording)\b": {
        "label": "No CCTV / Surveillance Evidence",
        "argument": "In the digital age, the absence of any CCTV or surveillance footage raises serious doubts about the prosecution's ability to place the accused at the scene.",
    },
    r"\bno\s+(bank|financial)\s+(records?|statements?|evidence|transactions?)\b": {
        "label": "No Financial Records",
        "argument": "No bank or financial records have been produced to substantiate allegations of financial wrongdoing.",
    },
    r"\bno\s+(phone|call|communication)\s+(records?|logs?|evidence)\b": {
        "label": "No Phone / Communication Records",
        "argument": "No telecommunication records have been tendered to establish alleged communications between parties.",
    },
    r"\bno\s+direct\s+evidence\b": {
        "label": "No Direct Evidence",
        "argument": "The prosecution relies entirely on circumstantial evidence. Conviction on circumstantial evidence alone requires that the circumstances be consistent only with the guilt of the accused.",
    },
    r"\bno\s+(DNA|fingerprint|ballistic)\b": {
        "label": "No Physical Forensic Trace",
        "argument": "The absence of DNA, fingerprint, or ballistic evidence where such evidence would be expected critically undermines the prosecution's case.",
    },
    r"\bno\s+arrest\s+warrant\b|\bwithout\s+(a\s+)?warrant\b": {
        "label": "Absence of Warrant",
        "argument": "A warrantless arrest or search may violate the accused's constitutional rights and render evidence obtained thereby inadmissible.",
    },
}

CONTRADICTION_PATTERNS = [
    (r"(\d{1,2}[:\.\s]\d{2}\s*(am|pm|hours?)?\s*(?:on)?\s*\d{1,2}\s*\w+\s*\d{4})", "Timeline Reference"),
    (r"\b(first|initial|original)\s+statement\b.*?\b(later|subsequent|revised|changed)\b", "Statement Change"),
    (r"\bbut\s+(then|later|subsequently|however)\b", "Narrative Contradiction"),
    (r"\b(contradicts?|conflicts?\s+with|inconsistent\s+with)\b", "Explicit Contradiction"),
]

EVIDENCE_PATTERNS = {
    r"\b(weapon|knife|gun|firearm|pistol|rifle|rod|iron bar|machete)\b": "Weapon",
    r"\b(drug|narcotics?|heroin|cocaine|cannabis|ganja|methamphetamine|ICE)\b": "Drugs",
    r"\b(phone|mobile|SIM|call records?|WhatsApp|Telegram)\b": "Phone Evidence",
    r"\b(bank|transaction|transfer|account|cheque|cash)\b": "Financial Evidence",
    r"\b(CCTV|camera|footage|video|recording|surveillance)\b": "CCTV / Video",
    r"\b(witness|testimony|depose|statement)\b": "Witness Statement",
    r"\b(fingerprint|DNA|blood|hair|fiber|trace)\b": "Forensic Evidence",
    r"\b(document|forged?|counterfeit|fake|fabricated)\b": "Documentary Evidence",
}

ENTITY_PATTERNS = {
    "suspects":      r"\b(?:the\s+)?(?:accused|suspect|defendant|respondent)\b[^\.\n]{0,60}",
    "organizations": r"\b(?:company|corporation|organization|gang|group|syndicate|network)\b[^\.\n]{0,40}",
    "locations":     r"\b(?:at|in|near|from)\s+(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b",
    "officers":      r"\b(?:IP|OIC|SI|PC|ASP|SSP|DIG|IGP|Detective|Inspector|Sergeant|Constable)\s+[A-Z][a-z]+\b",
}

# ══════════════════════════════════════════════════════════════════════════════
# PDF EXTRACTION
# ══════════════════════════════════════════════════════════════════════════════

def extract_with_pymupdf(pdf_bytes: bytes) -> tuple[str, int]:
    """Primary extraction using PyMuPDF. Returns (text, page_count)."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_text = []
    for page in doc:
        pages_text.append(page.get_text("text"))
    doc.close()
    return "\n".join(pages_text), len(pages_text)


def extract_with_pdfplumber(pdf_bytes: bytes) -> str:
    """Fallback extraction using pdfplumber (better for complex layouts)."""
    texts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                texts.append(t)
    return "\n".join(texts)


def extract_text_from_pdf(pdf_bytes: bytes) -> tuple[str, int, str]:
    """
    Extract text from PDF with automatic fallback.
    Returns (extracted_text, page_count, extraction_method)
    """
    # Try PyMuPDF first
    text, pages = extract_with_pymupdf(pdf_bytes)
    if len(text.strip()) > 100:
        return text.strip(), pages, "PyMuPDF"

    # Fallback to pdfplumber
    logger.info("PyMuPDF returned sparse text, trying pdfplumber ...")
    text = extract_with_pdfplumber(pdf_bytes)
    if len(text.strip()) > 100:
        return text.strip(), pages, "pdfplumber"

    # Last resort: OCR via pytesseract (if installed)
    try:
        import pytesseract
        from PIL import Image
        logger.info("Attempting OCR fallback via pytesseract ...")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        ocr_texts = []
        for page in doc:
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_texts.append(pytesseract.image_to_string(img, lang="eng+sin"))
        doc.close()
        return "\n".join(ocr_texts).strip(), pages, "Tesseract OCR"
    except Exception as ocr_err:
        logger.warning(f"OCR failed: {ocr_err}")

    return text.strip(), pages, "partial"


# ══════════════════════════════════════════════════════════════════════════════
# LEGAL NLP ANALYSIS ENGINE
# ══════════════════════════════════════════════════════════════════════════════

def find_sentence_containing(text: str, keyword: str) -> str:
    """Find the full sentence containing a keyword."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    for s in sentences:
        if keyword.lower() in s.lower():
            return s.strip()
    # Fallback: return surrounding context
    idx = text.lower().find(keyword.lower())
    if idx == -1:
        return ""
    start = max(0, idx - 100)
    end   = min(len(text), idx + 200)
    return text[start:end].strip()


def detect_weak_words(text: str) -> list:
    results = []
    text_lower = text.lower()
    for keyword, argument in WEAK_WORD_PATTERNS.items():
        if keyword in text_lower:
            original_sentence = find_sentence_containing(text, keyword)
            results.append({
                "issue":             "Weak Legal Wording",
                "detected_word":     keyword,
                "original_sentence": original_sentence,
                "defense_argument":  argument,
            })
    return results


def detect_missing_evidence(text: str) -> list:
    results = []
    text_lower = text.lower()
    for pattern, info in MISSING_EVIDENCE_PATTERNS.items():
        if re.search(pattern, text_lower):
            match = re.search(pattern, text_lower)
            original_sentence = find_sentence_containing(text, match.group(0)) if match else ""
            results.append({
                "issue":             "Missing Evidence",
                "detected_word":     info["label"],
                "original_sentence": original_sentence,
                "defense_argument":  info["argument"],
            })
    return results


def detect_evidence_found(text: str) -> list:
    found = []
    for pattern, label in EVIDENCE_PATTERNS.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            found.append({
                "type":     label,
                "mentions": list(set([m if isinstance(m, str) else m[0] for m in matches]))[:5],
            })
    return found


def detect_contradictions(text: str) -> list:
    contradictions = []
    for pattern, label in CONTRADICTION_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            context = find_sentence_containing(text, matches[0] if isinstance(matches[0], str) else matches[0][0])
            contradictions.append({
                "type":     label,
                "detected": str(matches[0])[:200],
                "context":  context,
                "argument": "This inconsistency in the prosecution's narrative creates reasonable doubt that must benefit the accused.",
            })
    return contradictions


def extract_entities(text: str) -> dict:
    entities = {}
    for entity_type, pattern in ENTITY_PATTERNS.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities[entity_type] = list(set([m.strip() for m in matches]))[:10]
    return entities


def extract_allegations(text: str) -> list:
    """Extract sentences containing allegation language."""
    allegations = []
    allegation_keywords = [
        "charged with", "accused of", "alleged to have", "committed",
        "involved in", "found with", "arrested for", "detected",
        "offence under section", "in contravention of"
    ]
    sentences = re.split(r'(?<=[.!?])\s+', text)
    for sent in sentences:
        if any(kw in sent.lower() for kw in allegation_keywords):
            allegations.append(sent.strip())
    return allegations[:10]


def generate_case_summary(text: str, entities: dict, allegations: list) -> str:
    """Generate a brief case summary from extracted data."""
    parts = []
    if allegations:
        parts.append(f"The B Report contains {len(allegations)} allegation(s).")
    suspects = entities.get("suspects", [])
    if suspects:
        parts.append(f"Accused/suspect references identified.")
    officers = entities.get("officers", [])
    if officers:
        parts.append(f"Police officers mentioned: {', '.join(officers[:3])}.")
    locations = entities.get("locations", [])
    if locations:
        parts.append(f"Locations referenced: {', '.join(locations[:3])}.")
    return " ".join(parts) if parts else "B Report text successfully extracted and analysed."


def calculate_risk_level(weak_words: list, missing_evidence: list, contradictions: list) -> str:
    score = len(weak_words) * 2 + len(missing_evidence) * 3 + len(contradictions) * 2
    if score >= 15:
        return "LOW"       # many weaknesses = low prosecution risk
    elif score >= 8:
        return "MEDIUM"
    elif score >= 3:
        return "HIGH"
    else:
        return "VERY HIGH"


def generate_recommendations(weak_words: list, missing_evidence: list, contradictions: list) -> list:
    recs = []
    if weak_words:
        recs.append("Challenge the prosecution on its reliance on speculative and weak language. File a No Case to Answer motion if the evidence consists primarily of suspicion.")
    if missing_evidence:
        recs.append("File a formal application for discovery to compel the prosecution to disclose all forensic reports, witness statements, and physical evidence in their possession.")
    if contradictions:
        recs.append("Cross-examine prosecution witnesses vigorously on timeline inconsistencies. Present the contradictions as evidence of fabrication or unreliable police records.")
    if not recs:
        recs.append("Conduct a comprehensive review of all prosecution evidence. File appropriate pre-trial motions to suppress unlawfully obtained evidence.")
    recs.append("Apply for bail citing the weakness of the prosecution's case and the accused's constitutional right to liberty pending trial.")
    recs.append("Engage an independent forensic expert to review and challenge any scientific evidence produced by the prosecution.")
    return recs


# ══════════════════════════════════════════════════════════════════════════════
# SINHALA ANALYSIS GENERATOR
# ══════════════════════════════════════════════════════════════════════════════

def generate_sinhala_analysis(case_summary: str, weak_words: list, missing_evidence: list) -> str:
    """Generate Sinhala legal analysis using Gemini, or return structured fallback."""
    if GEMINI_AVAILABLE and genai_client is not None:
        try:
            client = genai_client.Client(api_key=GEMINI_API_KEY)
            weak_str = "\n".join([f"- {w['detected_word']}: {w['original_sentence'][:100]}" for w in weak_words[:5]])
            missing_str = "\n".join([f"- {m['detected_word']}" for m in missing_evidence[:5]])
            prompt = f"""ඔබ ශ්‍රී ලංකාවේ අත්දැකීම්සහගත අපරාධ ආරක්ෂක නීතිඥයෙකු ලෙස කටයුතු කරනු ලබයි.

පහත B වාර්තා විශ්ලේෂණය පිළිබඳ සිංහල භාෂාවෙන් නිල නීතිමය අදහස් ලබා දෙන්න:

නඩු සාරාංශය: {case_summary}

දුර්වල නීතිමය වචන:
{weak_str if weak_str else 'හමු නොවීය'}

අස්ථාන සාක්ෂි:
{missing_str if missing_str else 'හමු නොවීය'}

කරුණාකර පහත ඇතුළත් කරන්න:
1. නඩුකරුගේ නීතිමය දුර්වලතා (Sinhala)
2. සාධාරණ සැකය (Sinhala)  
3. ආරක්ෂක උපාය (Sinhala)
4. නිර්දේශ (Sinhala)

වෘත්තීය සිංහල නීති භාෂාව පමණක් භාවිතා කරන්න."""

            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini error: {e}")

    # Structured Sinhala fallback
    return """## B වාර්තා ආරක්ෂක විශ්ලේෂණය

**1. නඩුකරුගේ නීතිමය දුර්වලතා:**
නඩුව "suspected" සහ "allegedly" වැනි සැකයට ගතිලු භාෂාව මත රඳා පවතී. සෘජු සාක්ෂිය නොමැතිව, නඩු ශ්‍රේෂ්ඨාධිකරණයේ ප්‍රමිතිය ඉටු නොවේ.

**2. සාධාරණ සැකය:**
නඩු කරුළු "reasonable doubt" හි ප්‍රමිතිය ඉක්මවා නොයෙයි. සෘජු සාක්ෂිය නොමැතිකම නිසා ශ්‍රී ලංකා ආණ්ඩුක්‍රම ව්‍යවස්ථාවේ 13(5) වගන්තිය යටතේ ආරෝපිතයාගේ නිර්දෝෂිතාව ස්ථාපිත වේ.

**3. ආරක්ෂක උපාය:**
- B වාර්තාවේ දුර්වල භාෂාව පදනම් කරගෙන "no case to answer" ආ‍රෝධය ගොනු කරන්න
- Forensic සාක්ෂිය ඉල්ලා සිටින්න
- ගැටලු සහිත ප්‍රකාශ cross-examination මගින් අභියෝගයට ලක් කරන්න

**4. නිර්දේශ:**
ජාමිය ලබා ගැනීමට ඉල්ලීමක් ඉදිරිපත් කළ යුතු අතර, නඩු ශ්‍රේෂ්ඨාධිකරණ ප්‍රමිතිය ඉටු නොකරන ලෙස ශ්‍රේෂ්ඨාධිකරණයට ප්‍රකාශ කළ යුතුය."""


# ══════════════════════════════════════════════════════════════════════════════
# RESPONSE MODELS
# ══════════════════════════════════════════════════════════════════════════════

class AnalysisResponse(BaseModel):
    status:           str
    extraction_method: str
    page_count:       int
    extracted_text:   str
    case_summary:     str
    allegations:      List[str]
    entities:         dict
    weak_words:       List[dict]
    missing_evidence: List[dict]
    contradictions:   List[dict]
    evidence_found:   List[dict]
    defense_arguments: List[dict]
    sinhala_analysis: str
    risk_level:       str
    recommendations:  List[str]


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
async def health():
    return {"status": "ok", "service": "B-Report Analysis Engine", "version": "1.0.0"}


@app.post("/analyze-b-report", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_b_report(file: UploadFile = File(...)):
    """
    Upload a B-Report PDF and receive a full structured legal defense analysis.
    Supports both digital PDFs and scanned PDFs (OCR fallback).
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, detail="Only PDF files are accepted.")

    if file.size and file.size > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(413, detail="PDF file too large. Maximum size is 50MB.")

    try:
        logger.info(f"Received B-Report: {file.filename}")
        pdf_bytes = await file.read()

        # ── 1. Extract text ──────────────────────────────────────────────────
        extracted_text, page_count, method = extract_text_from_pdf(pdf_bytes)
        logger.info(f"Extracted {len(extracted_text)} chars from {page_count} pages via {method}")

        if len(extracted_text.strip()) < 50:
            raise HTTPException(422, detail="Could not extract readable text from this PDF. The file may be corrupted or use an unsupported encoding.")

        # ── 2. Run NLP analysis ──────────────────────────────────────────────
        weak_words       = detect_weak_words(extracted_text)
        missing_evidence = detect_missing_evidence(extracted_text)
        contradictions   = detect_contradictions(extracted_text)
        evidence_found   = detect_evidence_found(extracted_text)
        entities         = extract_entities(extracted_text)
        allegations      = extract_allegations(extracted_text)

        # ── 3. Build all defense arguments ──────────────────────────────────
        all_defense = weak_words + missing_evidence + contradictions

        # ── 4. Case summary, risk, recommendations ───────────────────────────
        case_summary    = generate_case_summary(extracted_text, entities, allegations)
        risk_level      = calculate_risk_level(weak_words, missing_evidence, contradictions)
        recommendations = generate_recommendations(weak_words, missing_evidence, contradictions)

        # ── 5. Sinhala analysis ───────────────────────────────────────────────
        sinhala_analysis = generate_sinhala_analysis(case_summary, weak_words, missing_evidence)

        logger.info(f"Analysis complete: risk={risk_level}, weak={len(weak_words)}, missing={len(missing_evidence)}, contradictions={len(contradictions)}")

        return AnalysisResponse(
            status="success",
            extraction_method=method,
            page_count=page_count,
            extracted_text=extracted_text[:5000],   # truncate for response size
            case_summary=case_summary,
            allegations=allegations,
            entities=entities,
            weak_words=weak_words,
            missing_evidence=missing_evidence,
            contradictions=contradictions,
            evidence_found=evidence_found,
            defense_arguments=all_defense,
            sinhala_analysis=sinhala_analysis,
            risk_level=risk_level,
            recommendations=recommendations,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Analysis error: {exc}")
        raise HTTPException(500, detail=f"Analysis failed: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("b_report_analysis:app", host="0.0.0.0", port=8001, reload=True)
