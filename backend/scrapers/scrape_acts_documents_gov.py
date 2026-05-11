import os
import sys
import re
import json
import hashlib
from io import BytesIO
from urllib.parse import urljoin

import requests
import psycopg2
import pdfplumber
from bs4 import BeautifulSoup
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding

load_dotenv()

BASE_URL = "https://documents.gov.lk/view/acts/acts.html"
DB_URL = os.getenv("DATABASE_URL")

HEADERS = {
    "User-Agent": "Mozilla/5.0 LegalDraftResearchBot/1.0"
}

START_YEAR = 2026
END_YEAR = 1981

MAX_ACT_PDFS = None  # None = all acts
MAX_SECTIONS_PER_ACT = 120


def clean_text(text: str) -> str:
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def get_html(url: str) -> str:
    print("Fetching:", url)
    response = requests.get(url, headers=HEADERS, timeout=40)
    response.raise_for_status()
    return response.text


def get_year_links():
    html = get_html(BASE_URL)
    soup = BeautifulSoup(html, "html.parser")

    links = {}

    for a in soup.find_all("a", href=True):
        href = a["href"]

        match = re.search(r"acts_(\d{4})\.html", href)

        if match:
            year = int(match.group(1))

            if END_YEAR <= year <= START_YEAR:
                links[year] = urljoin(BASE_URL, href)

    ordered_links = []

    for year in sorted(links.keys(), reverse=True):
        ordered_links.append((year, links[year]))

    return ordered_links


def get_pdf_links(year_url: str):
    html = get_html(year_url)
    soup = BeautifulSoup(html, "html.parser")

    pdfs = []

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()

        if not href.lower().endswith(".pdf"):
            continue

        # Use only English PDFs for now
        if not re.search(r"_E\.pdf$", href, re.IGNORECASE):
            continue

        full_url = urljoin(year_url, href)

        if full_url not in pdfs:
            pdfs.append(full_url)

    return pdfs


def extract_pdf_text(pdf_url: str):
    try:
        print("Reading PDF:", pdf_url)

        response = requests.get(pdf_url, headers=HEADERS, timeout=60)
        response.raise_for_status()

        text = ""

        with pdfplumber.open(BytesIO(response.content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += "\n" + page_text

        return clean_text(text)

    except Exception as error:
        print("PDF failed:", error)
        return ""


def extract_act_name_and_no(text: str, pdf_url: str):
    first_part = text[:2500]

    match = re.search(
        r"([A-Z][A-Z\s\(\),\-]+ACT),?\s+No\.?\s+([0-9]+)\s+of\s+([0-9]{4})",
        first_part,
        re.IGNORECASE,
    )

    if match:
        act_name = clean_text(match.group(1)).title()
        act_no = f"No. {match.group(2)} of {match.group(3)}"

        act_name = act_name.replace(
            "Parliament Of The Democratic Socialist Republic Of Sri Lanka ", ""
        )

        return act_name, act_no

    file_name = os.path.basename(pdf_url).replace("_", " ").replace(".pdf", "")
    return file_name, ""


def detect_category(act_name: str, content: str):
    combined = f"{act_name} {content}".lower()

    keyword_map = {
        "criminal": [
            "penal", "criminal", "offence", "accused", "murder", "assault",
            "theft", "robbery", "bail", "prosecution", "conviction", "prison",
            "narcotic", "dangerous drugs"
        ],
        "civil": [
            "civil", "procedure", "court", "application", "writ", "tax",
            "revenue", "authority", "commission", "regulation", "administration"
        ],
        "contract": [
            "contract", "agreement", "company", "companies", "partnership",
            "business", "obligation", "consideration", "breach"
        ],
        "property": [
            "land", "property", "deed", "mortgage", "lease", "partition",
            "boundary", "possession", "immovable", "notary", "condominium"
        ],
        "family": [
            "marriage", "divorce", "matrimonial", "maintenance", "custody",
            "child", "children", "adoption", "spouse", "family"
        ],
    }

    scores = {}

    for category, words in keyword_map.items():
        scores[category] = sum(1 for word in words if word in combined)

    best = max(scores, key=scores.get)

    if scores[best] == 0:
        return "civil"

    return best


def is_good_section_text(text: str):
    lower = text.lower()

    if len(text.split()) < 35:
        return False

    bad_patterns = [
        "printed on the order of government",
        "published as a supplement",
        "certified on",
        "gazette",
    ]

    bad_hits = sum(1 for pattern in bad_patterns if pattern in lower)

    if bad_hits >= 2 and len(text.split()) < 90:
        return False

    weird_chars = sum(1 for ch in text if ch in ["û", "ý", "þ", "ÿ", "�"])

    if weird_chars > 2:
        return False

    return True


def extract_sections(text: str):
    text = clean_text(text)

    pattern = r"(?=(?:^|\s)(\d{1,3}[A-Z]?)\.\s+)"

    matches = list(re.finditer(pattern, text))

    sections = []

    if len(matches) < 2:
        return sections

    for index, match in enumerate(matches):
        section_number = match.group(1)
        start = match.start()

        if index + 1 < len(matches):
            end = matches[index + 1].start()
        else:
            end = len(text)

        section_text = clean_text(text[start:end])

        if is_good_section_text(section_text):
            sections.append((section_number, section_text))

    return sections


def make_short_text(act_name: str, act_no: str, section_number: str):
    if act_no:
        return f"under Section {section_number} of the {act_name}, {act_no}"

    return f"under Section {section_number} of the {act_name}"


def insert_section(
    cursor,
    seen,
    act_name,
    act_no,
    section_number,
    category,
    short_text,
    content,
):
    h = hash_text(content)

    if h in seen:
        return False

    seen.add(h)

    embedding = get_embedding(content)
    embedding_json = json.dumps(embedding.tolist())

    cursor.execute(
        """
        INSERT INTO legal_content
        (
            content_type,
            category,
            title,
            content,
            embedding,
            act_name,
            act_no,
            section_number,
            short_text
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            "statute",
            category,
            short_text,
            content,
            embedding_json,
            act_name,
            act_no,
            section_number,
            short_text,
        ),
    )

    return True


def main():
    print("Using DB:", DB_URL)

    if not DB_URL:
        raise Exception("DATABASE_URL missing in .env")

    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    seen = set()
    processed_pdfs = 0
    total_inserted = 0

    year_links = get_year_links()

    print("Years found:", [year for year, _ in year_links])

    try:
        for year, year_url in year_links:
            print("\n================================")
            print("YEAR:", year)
            print("================================")

            pdf_links = get_pdf_links(year_url)

            print("English PDFs found:", len(pdf_links))

            for pdf_url in pdf_links:
                if MAX_ACT_PDFS is not None and processed_pdfs >= MAX_ACT_PDFS:
                    break

                processed_pdfs += 1

                print("\n--------------------------------")
                print(f"PDF {processed_pdfs}")
                print(pdf_url)
                print("--------------------------------")

                text = extract_pdf_text(pdf_url)

                if len(text) < 500:
                    print("Skipped: too little text")
                    continue

                act_name, act_no = extract_act_name_and_no(text, pdf_url)
                sections = extract_sections(text)

                print("Act Name:", act_name)
                print("Act No:", act_no)
                print("Sections found:", len(sections))

                if not sections:
                    print("Skipped: no sections detected")
                    continue

                inserted_for_pdf = 0

                for section_number, section_text in sections[:MAX_SECTIONS_PER_ACT]:
                    category = detect_category(act_name, section_text)
                    short_text = make_short_text(act_name, act_no, section_number)

                    inserted = insert_section(
                        cursor=cursor,
                        seen=seen,
                        act_name=act_name,
                        act_no=act_no,
                        section_number=section_number,
                        category=category,
                        short_text=short_text,
                        content=section_text,
                    )

                    if inserted:
                        inserted_for_pdf += 1
                        total_inserted += 1
                        print("Inserted:", short_text)

                conn.commit()
                print("Committed PDF sections:", inserted_for_pdf)

            if MAX_ACT_PDFS is not None and processed_pdfs >= MAX_ACT_PDFS:
                break

    except KeyboardInterrupt:
        print("Stopped by user. Committing saved records...")
        conn.commit()

    except Exception as error:
        print("Fatal error:", error)
        conn.rollback()

    finally:
        cursor.close()
        conn.close()

    print("\nDONE")
    print("Processed PDFs:", processed_pdfs)
    print("Total sections inserted:", total_inserted)


if __name__ == "__main__":
    main()