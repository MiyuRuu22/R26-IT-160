import re
import requests
import pandas as pd
from rapidfuzz import fuzz
from app.services.dataset_loader import load_local_dataset


BAD_NAME_TERMS = [
    "vs",
    "v.",
    " v ",
    "attorney general",
    "minister",
    "secretary",
    "respondent",
    "respondents",
]


def normalize_text(text: str) -> str:
    text = str(text or "").strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text


def normalize_name_key(name: str) -> str:
    name = normalize_text(name)
    name = re.sub(r"[^a-z0-9\s]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def clean_person_name(name: str) -> str:
    name = str(name or "").strip()
    name = re.sub(r"\(.*?\)", "", name)

    remove_words = [
        "and others",
        "others",
        "et al",
        "appellant",
        "appellants",
        "respondent",
        "respondents",
        "petitioner",
        "petitioners",
        "plaintiff",
        "plaintiffs",
        "defendant",
        "defendants",
        "1st",
        "2nd",
        "3rd",
        "4th",
    ]

    lowered = name.lower()
    for word in remove_words:
        lowered = lowered.replace(word, "")

    name = re.sub(r"[^a-zA-Z0-9.\s]", " ", lowered)
    name = re.sub(r"\s+", " ", name).strip()

    return name.title()


def extract_primary_client_name(parties: str) -> str:
    parties = str(parties or "").strip()

    if not parties:
        return ""

    split_patterns = [
        r"\s+vs\.\s+",
        r"\s+vs\s+",
        r"\s+v\.\s+",
        r"\s+v\s+",
        r"\s+VS\.\s+",
        r"\s+VS\s+",
        r"\s+V\.\s+",
        r"\s+V\s+",
    ]

    candidate = parties

    for pattern in split_patterns:
        parts = re.split(pattern, candidate, maxsplit=1, flags=re.IGNORECASE)
        if len(parts) > 1:
            candidate = parts[0]
            break

    candidate = candidate.split(",")[0]
    candidate = candidate.split(";")[0]
    candidate = clean_person_name(candidate)

    return candidate.strip()


def is_valid_client_name(name: str) -> bool:
    name_n = normalize_text(name)

    if not name_n or len(name_n) < 3:
        return False

    for term in BAD_NAME_TERMS:
        if term in name_n:
            return False

    words = name_n.split()

    if len(words) > 6:
        return False

    return True


def safe_pdf_url(url: str) -> str:
    url = str(url or "").strip()

    if not url:
        return ""

    lower_url = url.lower()

    if (
        "404" in lower_url
        or "notfound" in lower_url
        or "not-found" in lower_url
    ):
        return ""

    if not (
        lower_url.startswith("http://")
        or lower_url.startswith("https://")
    ):
        return ""

    try:
        response = requests.get(
            url,
            timeout=8,
            allow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/pdf,text/html,*/*",
            },
        )

        final_url = response.url.lower()
        content_type = response.headers.get("content-type", "").lower()

        if response.status_code != 200:
            return ""

        # Real valid PDF
        if "application/pdf" in content_type:
            return response.url

        # Some sites return PDF but missing proper content-type
        if final_url.endswith(".pdf") and "text/html" not in content_type:
            return response.url

        # If redirected to homepage or HTML page, reject
        if "text/html" in content_type:
            return ""

        return ""

    except Exception:
        return ""


def infer_court_location(row: pd.Series) -> str:
    text = f"{row.get('num', '')} {row.get('description', '')} {row.get('parties', '')}".lower()

    court_locations = [
        "Colombo", "Fort", "Maligakanda", "Mount Lavinia", "Negombo", "Ja-Ela",
        "Gampaha", "Attanagalla", "Minuwangoda", "Mirigama",
        "Kalutara", "Panadura", "Horana", "Matugama", "Aluthgama",
        "Kandy", "Peradeniya", "Gampola", "Nawalapitiya", "Teldeniya",
        "Matale", "Dambulla",
        "Nuwara Eliya", "Hatton",
        "Galle", "Ambalangoda", "Elpitiya",
        "Matara", "Akuressa", "Weligama",
        "Hambantota", "Tangalle", "Tissamaharama",
        "Jaffna", "Chavakachcheri", "Point Pedro", "Kayts",
        "Kilinochchi",
        "Mannar",
        "Vavuniya",
        "Batticaloa", "Eravur", "Valachchenai",
        "Kalmunai", "Akkaraipattu", "Samanthurai",
        "Trincomalee", "Kinniya", "Mutur",
        "Kurunegala", "Kuliyapitiya", "Nikaweratiya",
        "Puttalam", "Chilaw", "Marawila",
        "Anuradhapura", "Kekirawa", "Medawachchiya",
        "Polonnaruwa", "Hingurakgoda",
        "Badulla", "Bandarawela", "Haputale",
        "Monaragala", "Wellawaya",
        "Ratnapura", "Balangoda", "Embilipitiya",
        "Kegalle", "Mawanella", "Warakapola",
    ]

    court_locations = sorted(court_locations, key=len, reverse=True)

    for location in court_locations:
        if location.lower() in text:
            return location

    return "Unknown"


def infer_case_type(text: str) -> str:
    t = str(text or "").lower()

    if (
        "criminal" in t
        or "conviction" in t
        or "offence" in t
        or "attorney general" in t
    ):
        return "Criminal"

    if (
        "commercial" in t
        or "company" in t
        or "contract" in t
        or "insurance" in t
    ):
        return "Commercial"

    return "Civil"


def build_client_key(display_name: str, court_location: str) -> str:
    name_key = normalize_name_key(display_name).replace(" ", "_")
    location_key = normalize_name_key(court_location).replace(" ", "_")
    return f"{name_key}__{location_key}"


def search_matching_clients(
    full_name: str,
    court_location: str = "",
    case_type_hint: str = "",
):
    df = load_local_dataset()

    full_name_n = normalize_name_key(full_name)
    court_location_n = normalize_text(court_location)
    case_type_hint_n = normalize_text(case_type_hint)

    candidates = []

    for _, row in df.iterrows():
        parties = str(row.get("parties", ""))
        description = str(row.get("description", ""))

        display_name = extract_primary_client_name(parties)

        if not is_valid_client_name(display_name):
            continue

        display_name_n = normalize_name_key(display_name)

        if not display_name_n:
            continue

        name_score = fuzz.ratio(full_name_n, display_name_n)
        partial_score = fuzz.partial_ratio(full_name_n, display_name_n)
        token_score = fuzz.token_set_ratio(full_name_n, display_name_n)

        starts_bonus = 0
        if display_name_n.startswith(full_name_n):
            starts_bonus = 15
        elif any(word.startswith(full_name_n) for word in display_name_n.split()):
            starts_bonus = 8

        final_score = max(name_score, partial_score, token_score) + starts_bonus

        if final_score < 88:
            continue

        inferred_location = infer_court_location(row)
        inferred_type = infer_case_type(description)

        if court_location_n and court_location_n not in normalize_text(inferred_location):
            continue

        if case_type_hint_n and case_type_hint_n not in normalize_text(inferred_type):
            continue

        client_key = build_client_key(display_name, inferred_location)

        candidates.append(
            {
                "client_key": client_key,
                "display_name": display_name,
                "court_location": inferred_location,
                "case_type": inferred_type,
                "source": str(row.get("source", "")),
                "match_score": final_score,
                "doc_id": str(row.get("doc_id", "")),
            }
        )

    if not candidates:
        return []

    temp = pd.DataFrame(candidates)

    grouped = (
        temp.groupby(
            ["client_key", "display_name", "court_location"],
            as_index=False,
        )
        .agg(
            case_count=("doc_id", "count"),
            best_score=("match_score", "max"),
            source=("source", "first"),
        )
        .sort_values(by=["best_score", "case_count"], ascending=False)
    )

    return grouped[
        ["client_key", "display_name", "court_location", "case_count", "source"]
    ].head(50).to_dict(orient="records")


def get_client_cases_by_key(client_key: str):
    df = load_local_dataset()
    target_key = str(client_key or "").strip()

    cases = []

    for _, row in df.iterrows():
        parties = str(row.get("parties", ""))
        description = str(row.get("description", ""))

        display_name = extract_primary_client_name(parties)

        if not is_valid_client_name(display_name):
            continue

        inferred_location = infer_court_location(row)
        generated_key = build_client_key(display_name, inferred_location)

        if generated_key != target_key:
            continue

        case_type = infer_case_type(description)

        # Use validated PDF first
        validated_url = str(
            row.get("validated_pdf_url", "")
        ).strip()

        old_url = str(
            row.get("url_pdf", "")
        ).strip()

        if validated_url:
            pdf_url = validated_url
        else:
            pdf_url = safe_pdf_url(old_url)

        cases.append(
            {
                "id": str(row.get("doc_id", "")),
                "title": str(row.get("num", "Unknown Case")),
                "type": case_type,
                "date": str(row.get("date_str", "")),
                "pdf_url": pdf_url,
                "pdf_available": bool(pdf_url),
                "description": description,
                "parties": parties,
                "source": str(row.get("source", "")),
                "display_name": display_name,
                "court_location": inferred_location,
            }
        )

    return cases