import os
import sys
import re
import json
import hashlib
import psycopg2
from bs4 import BeautifulSoup
from pypdf import PdfReader

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding


DATABASE_URL = "postgresql://postgres:82720894@localhost:5432/legaldb"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw_web")


def clean_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def read_html_file(path: str):
    with open(path, "r", encoding="utf-8", errors="ignore") as file:
        html = file.read()

    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    title_tag = soup.find("title")
    title = title_tag.get_text(" ", strip=True) if title_tag else os.path.basename(path)

    text = soup.get_text(" ")
    return title[:500], clean_text(text)


def read_text_file(path: str):
    with open(path, "r", encoding="utf-8", errors="ignore") as file:
        text = file.read()

    title = os.path.basename(path)
    return title[:500], clean_text(text)


def read_pdf_file(path: str):
    reader = PdfReader(path)
    pages = []

    for page in reader.pages:
        page_text = page.extract_text() or ""
        pages.append(page_text)

    title = os.path.basename(path)
    return title[:500], clean_text(" ".join(pages))


def split_into_chunks(text: str, max_words: int = 130):
    words = text.split()
    chunks = []

    for i in range(0, len(words), max_words):
        chunk = " ".join(words[i:i + max_words]).strip()

        if len(chunk) > 120:
            chunks.append(chunk)

    return chunks


def detect_content_type(title: str, text: str):
    combined = f"{title} {text}".lower()

    if "court" in combined or "judgment" in combined or "appellant" in combined or "respondent" in combined:
        return "case"

    return "statute"


def detect_category(title: str, content: str):
    combined = f"{title} {content}".lower()

    scores = {
        "criminal": 0,
        "civil": 0,
        "contract": 0,
        "property": 0,
        "family": 0,
    }

    criminal_keywords = [
        "penal", "criminal", "offence", "accused", "murder", "hurt",
        "assault", "theft", "robbery", "bail", "prosecution", "conviction",
        "sentence", "reasonable doubt"
    ]

    civil_keywords = [
        "civil procedure", "plaint", "damages", "injunction", "defendant",
        "plaintiff", "negligence", "cause of action", "civil"
    ]

    contract_keywords = [
        "contract", "agreement", "consideration", "breach", "specific performance",
        "offer", "acceptance", "obligation", "sale of goods"
    ]

    property_keywords = [
        "land", "property", "deed", "mortgage", "lease", "partition",
        "boundary", "possession", "immovable", "notary", "frauds"
    ]

    family_keywords = [
        "marriage", "divorce", "matrimonial", "maintenance", "custody",
        "child", "adoption", "spouse", "family"
    ]

    for word in criminal_keywords:
        if word in combined:
            scores["criminal"] += 1

    for word in civil_keywords:
        if word in combined:
            scores["civil"] += 1

    for word in contract_keywords:
        if word in combined:
            scores["contract"] += 1

    for word in property_keywords:
        if word in combined:
            scores["property"] += 1

    for word in family_keywords:
        if word in combined:
            scores["family"] += 1

    best_category = max(scores, key=scores.get)

    if scores[best_category] == 0:
        return "civil"

    return best_category


def content_hash(content: str):
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def insert_item(cursor, seen_hashes, content_type, category, title, content):
    content = clean_text(content)

    if len(content) < 120:
        return False

    h = content_hash(content)

    if h in seen_hashes:
        return False

    seen_hashes.add(h)

    embedding = get_embedding(content)
    embedding_json = json.dumps(embedding.tolist())

    cursor.execute(
        """
        INSERT INTO legal_content
        (content_type, category, title, content, embedding)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            content_type,
            category,
            title[:500],
            content,
            embedding_json,
        )
    )

    return True


def main():
    print("Raw folder:", RAW_DIR)

    if not os.path.exists(RAW_DIR):
        print("raw_web folder not found.")
        return

    files = []

    for root, dirs, filenames in os.walk(RAW_DIR):
        for filename in filenames:
            lower = filename.lower()

            if lower.endswith(".html") or lower.endswith(".htm") or lower.endswith(".txt") or lower.endswith(".pdf"):
                files.append(os.path.join(root, filename))

    if not files:
        print("No legal files found in data/raw_web.")
        return

    print(f"Found {len(files)} files.")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    seen_hashes = set()
    inserted_count = 0

    for file_index, path in enumerate(files, start=1):
        try:
            print("\n==============================")
            print(f"Reading {file_index}/{len(files)}: {path}")

            lower = path.lower()

            if lower.endswith(".html") or lower.endswith(".htm"):
                title, text = read_html_file(path)
            elif lower.endswith(".pdf"):
                title, text = read_pdf_file(path)
            else:
                title, text = read_text_file(path)

            if len(text) < 300:
                print("Skipped: too little text")
                continue

            content_type = detect_content_type(title, text)
            category = detect_category(title, text)
            chunks = split_into_chunks(text, max_words=130)

            print("Title:", title)
            print("Type:", content_type)
            print("Category:", category)
            print("Chunks:", len(chunks))

            for chunk_index, chunk in enumerate(chunks, start=1):
                chunk_title = f"{title} — Extract {chunk_index}"

                inserted = insert_item(
                    cursor=cursor,
                    seen_hashes=seen_hashes,
                    content_type=content_type,
                    category=category,
                    title=chunk_title,
                    content=chunk,
                )

                if inserted:
                    inserted_count += 1
                    print(f"Inserted {inserted_count}: {chunk_title[:80]}")

                if inserted_count % 10 == 0:
                    conn.commit()
                    print("Committed...")

            conn.commit()

        except Exception as error:
            print("Failed file:", path)
            print(error)
            conn.rollback()

    cursor.close()
    conn.close()

    print("\nDONE")
    print("Inserted total:", inserted_count)


if __name__ == "__main__":
    main()