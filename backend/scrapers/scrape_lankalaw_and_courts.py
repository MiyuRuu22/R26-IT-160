import os
import sys
import re
import json
import time
import hashlib
from urllib.parse import urljoin

import requests
import psycopg2
from bs4 import BeautifulSoup
from pypdf import PdfReader
from io import BytesIO

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding


DATABASE_URL = "postgresql://postgres:82720894@localhost:5432/legaldb"

HEADERS = {
    "User-Agent": "Mozilla/5.0 LegalDraftStudentResearchBot/1.0"
}

MAX_PDFS = 80
MAX_CHUNKS_PER_PDF = 5

PDF_INDEX_URLS = [
    "https://supremecourt.lk/wp-content/uploads/judgements/",
    "https://courtofappeal.lk/wp-content/uploads/judgments/",
    "https://courtofappeal.lk/wp-content/uploads/judgements/",
]


LEGAL_KEYWORDS = [
    "court",
    "judgment",
    "judgement",
    "appellant",
    "respondent",
    "petitioner",
    "plaintiff",
    "defendant",
    "accused",
    "justice",
    "appeal",
    "application",
    "order",
    "section",
    "evidence",
    "law",
]


def clean_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def content_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def get_page(url: str):
    try:
        print(f"Fetching: {url}")
        response = requests.get(url, headers=HEADERS, timeout=40)
        response.raise_for_status()
        return response
    except Exception as error:
        print("Fetch failed:", url)
        print(error)
        return None


def is_pdf_url(url: str) -> bool:
    return url.lower().split("?")[0].endswith(".pdf")


def collect_pdf_links_from_index(index_url: str):
    response = get_page(index_url)

    if not response:
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    pdf_links = []

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        full_url = urljoin(index_url, href)

        if is_pdf_url(full_url) and full_url not in pdf_links:
            pdf_links.append(full_url)

    return pdf_links


def extract_pdf_text(response, pdf_url: str):
    try:
        reader = PdfReader(BytesIO(response.content))
        pages = []

        for page in reader.pages:
            page_text = page.extract_text() or ""
            pages.append(page_text)

        title = os.path.basename(pdf_url).replace("%20", " ").replace("_", " ")
        text = clean_text(" ".join(pages))

        return title[:500], text

    except Exception as error:
        print("PDF extraction failed:", error)
        return os.path.basename(pdf_url)[:500], ""


def is_real_legal_text(text: str) -> bool:
    lower = text.lower()
    words = text.split()

    if len(words) < 80:
        return False

    hits = sum(1 for word in LEGAL_KEYWORDS if word in lower)

    if hits < 3:
        return False

    bad_index_patterns = [
        "index of",
        "parent directory",
        "last modified",
        "name size description",
        "wp-content/uploads",
        ".pdf .pdf .pdf",
    ]

    for pattern in bad_index_patterns:
        if pattern in lower:
            return False

    weird_chars = sum(1 for ch in text if ch in ["û", "ý", "þ", "ÿ", "�"])
    if weird_chars > 3:
        return False

    alphabet_chars = sum(1 for ch in text if ch.isalpha())
    total_chars = max(len(text), 1)

    if alphabet_chars / total_chars < 0.45:
        return False

    return True


def split_into_chunks(text: str, max_words: int = 160):
    words = text.split()
    chunks = []

    for i in range(0, len(words), max_words):
        chunk = clean_text(" ".join(words[i:i + max_words]))

        if is_real_legal_text(chunk):
            chunks.append(chunk)

    return chunks


def detect_category(title: str, content: str):
    combined = f"{title} {content}".lower()

    keyword_map = {
        "criminal": [
            "penal", "criminal", "offence", "accused", "murder", "hurt",
            "assault", "theft", "robbery", "bail", "prosecution",
            "conviction", "sentence", "reasonable doubt"
        ],
        "civil": [
            "civil procedure", "plaint", "damages", "injunction",
            "defendant", "plaintiff", "negligence", "cause of action",
            "writ", "application"
        ],
        "contract": [
            "contract", "agreement", "consideration", "breach",
            "specific performance", "offer", "acceptance", "obligation"
        ],
        "property": [
            "land", "property", "deed", "mortgage", "lease", "partition",
            "boundary", "possession", "immovable", "notary"
        ],
        "family": [
            "marriage", "divorce", "matrimonial", "maintenance",
            "custody", "child", "adoption", "spouse", "family"
        ],
    }

    scores = {}

    for category, words in keyword_map.items():
        scores[category] = sum(1 for word in words if word in combined)

    best = max(scores, key=scores.get)

    if scores[best] == 0:
        return "civil"

    return best


def insert_item(cursor, seen_hashes, category, title, content):
    cleaned = clean_text(content)

    if not is_real_legal_text(cleaned):
        return False

    h = content_hash(cleaned)

    if h in seen_hashes:
        return False

    seen_hashes.add(h)

    embedding = get_embedding(cleaned)
    embedding_json = json.dumps(embedding.tolist())

    cursor.execute(
        """
        INSERT INTO legal_content
        (content_type, category, title, content, embedding)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            "case",
            category,
            title[:500],
            cleaned,
            embedding_json,
        )
    )

    return True


def main():
    print("Connecting to PostgreSQL...")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    seen_hashes = set()
    all_pdf_links = []

    for index_url in PDF_INDEX_URLS:
        links = collect_pdf_links_from_index(index_url)

        print(f"PDFs found from {index_url}: {len(links)}")

        for link in links:
            if link not in all_pdf_links:
                all_pdf_links.append(link)

    all_pdf_links = all_pdf_links[:MAX_PDFS]

    print("Total PDF links selected:", len(all_pdf_links))

    total_inserted = 0

    try:
        for pdf_index, pdf_url in enumerate(all_pdf_links, start=1):
            print("\n==============================")
            print(f"PDF {pdf_index}/{len(all_pdf_links)}")
            print(pdf_url)
            print("==============================")

            response = get_page(pdf_url)

            if not response:
                continue

            content_type = response.headers.get("content-type", "").lower()

            if "pdf" not in content_type and not is_pdf_url(pdf_url):
                print("Skipped: not PDF response")
                continue

            title, text = extract_pdf_text(response, pdf_url)

            if not is_real_legal_text(text):
                print("Skipped: extracted text not valid legal judgment")
                continue

            category = detect_category(title, text)
            chunks = split_into_chunks(text, max_words=160)[:MAX_CHUNKS_PER_PDF]

            print("Title:", title)
            print("Category:", category)
            print("Text length:", len(text))
            print("Valid chunks:", len(chunks))

            for chunk_index, chunk in enumerate(chunks, start=1):
                chunk_title = f"{title} — Case Extract {chunk_index}"

                inserted = insert_item(
                    cursor=cursor,
                    seen_hashes=seen_hashes,
                    category=category,
                    title=chunk_title,
                    content=chunk,
                )

                if inserted:
                    total_inserted += 1
                    print("Inserted:", chunk_title[:100])

            conn.commit()
            time.sleep(1)

    except KeyboardInterrupt:
        print("Stopped by user. Saving inserted data...")
        conn.commit()

    except Exception as error:
        print("Fatal error:", error)
        conn.rollback()

    finally:
        cursor.close()
        conn.close()

    print("\nDONE")
    print("Total inserted:", total_inserted)


if __name__ == "__main__":
    main()