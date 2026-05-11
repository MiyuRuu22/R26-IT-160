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

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding


DATABASE_URL = "postgresql://postgres:82720894@localhost:5432/legaldb"

# Increase these later if needed
MAX_LAWS = 120
MAX_CASES_PER_SOURCE = 80

LAW_INDEX_URL = "https://www.commonlii.org/lk/legis/num_act/"

CASE_SOURCES = [
    {
        "index_url": "https://www.commonlii.org/lk/cases/LKSC/",
        "court": "Supreme Court",
    },
    {
        "index_url": "https://www.commonlii.org/lk/cases/LKCA/",
        "court": "Court of Appeal",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 LegalDraftStudentResearchBot/1.0"
}


def clean_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"(\[.*?\])", "", text)
    return text.strip()


def get_page(url: str):
    try:
        print(f"Fetching: {url}")
        response = requests.get(url, headers=HEADERS, timeout=25)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Fetch failed: {url}")
        print(e)
        return None


def extract_page_text(html: str):
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    title_tag = soup.find("title")
    title = title_tag.get_text(" ", strip=True) if title_tag else "Untitled"

    body = soup.get_text(" ")
    body = clean_text(body)

    return title[:500], body


def split_into_chunks(text: str, max_words: int = 130):
    words = text.split()
    chunks = []

    for i in range(0, len(words), max_words):
        chunk = " ".join(words[i:i + max_words]).strip()

        if len(chunk) > 120:
            chunks.append(chunk)

    return chunks


def detect_category(title: str, content: str):
    combined = f"{title} {content}".lower()

    criminal_keywords = [
        "penal", "criminal", "offence", "accused", "murder", "hurt",
        "assault", "theft", "robbery", "bail", "prosecution", "sentence",
        "conviction", "evidence ordinance"
    ]

    civil_keywords = [
        "civil procedure", "plaint", "damages", "injunction", "defendant",
        "plaintiff", "cause of action", "negligence", "delict"
    ]

    contract_keywords = [
        "contract", "agreement", "consideration", "breach", "specific performance",
        "sale of goods", "offer", "acceptance", "obligation"
    ]

    property_keywords = [
        "property", "land", "deed", "frauds", "mortgage", "lease",
        "partition", "boundary", "possession", "immovable"
    ]

    family_keywords = [
        "marriage", "divorce", "matrimonial", "maintenance", "custody",
        "child", "adoption", "family", "spouse"
    ]

    scores = {
        "criminal": sum(1 for word in criminal_keywords if word in combined),
        "civil": sum(1 for word in civil_keywords if word in combined),
        "contract": sum(1 for word in contract_keywords if word in combined),
        "property": sum(1 for word in property_keywords if word in combined),
        "family": sum(1 for word in family_keywords if word in combined),
    }

    best_category = max(scores, key=scores.get)

    if scores[best_category] == 0:
        return "civil"

    return best_category


def content_hash(content: str):
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def insert_item(cursor, seen_hashes, content_type, category, title, content):
    cleaned_content = clean_text(content)

    if len(cleaned_content) < 120:
        return False

    h = content_hash(cleaned_content)

    if h in seen_hashes:
        return False

    seen_hashes.add(h)

    embedding = get_embedding(cleaned_content)
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
            cleaned_content,
            embedding_json,
        )
    )

    return True


def collect_law_urls():
    html = get_page(LAW_INDEX_URL)

    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    urls = []

    for a in soup.find_all("a", href=True):
        href = a["href"]

        if href.startswith("../"):
            continue

        full_url = urljoin(LAW_INDEX_URL, href)

        if "/lk/legis/num_act/" in full_url and full_url.endswith("/"):
            if full_url != LAW_INDEX_URL and full_url not in urls:
                urls.append(full_url)

    return urls[:MAX_LAWS]


def collect_case_urls_from_index(index_url: str, limit: int):
    html = get_page(index_url)

    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")

    case_urls = []
    year_or_directory_urls = []

    for a in soup.find_all("a", href=True):
        href = a["href"]
        full_url = urljoin(index_url, href)

        if href.endswith(".html"):
            if full_url not in case_urls:
                case_urls.append(full_url)

        elif href.endswith("/") and "/lk/cases/" in full_url and full_url != index_url:
            if full_url not in year_or_directory_urls:
                year_or_directory_urls.append(full_url)

    # CommonLII case pages are often inside year folders, so scan those folders too
    for directory_url in year_or_directory_urls:
        if len(case_urls) >= limit:
            break

        sub_html = get_page(directory_url)

        if not sub_html:
            continue

        sub_soup = BeautifulSoup(sub_html, "html.parser")

        for a in sub_soup.find_all("a", href=True):
            href = a["href"]
            full_url = urljoin(directory_url, href)

            if href.endswith(".html") and full_url not in case_urls:
                case_urls.append(full_url)

            if len(case_urls) >= limit:
                break

        time.sleep(0.5)

    return case_urls[:limit]


def scrape_laws(cursor, seen_hashes):
    print("\n==============================")
    print("SCRAPING LAWS / STATUTES")
    print("==============================")

    law_urls = collect_law_urls()

    print(f"Found law URLs: {len(law_urls)}")

    inserted = 0

    for law_index, url in enumerate(law_urls, start=1):
        html = get_page(url)

        if not html:
            continue

        title, text = extract_page_text(html)

        if len(text) < 300:
            print(f"Skipped law: {title} - too little text")
            continue

        category = detect_category(title, text)
        chunks = split_into_chunks(text, max_words=130)

        print(f"[LAW {law_index}/{len(law_urls)}] {title}")
        print(f"Category: {category}")
        print(f"Chunks: {len(chunks)}")

        for chunk_index, chunk in enumerate(chunks, start=1):
            chunk_title = f"{title} — Section Extract {chunk_index}"

            try:
                ok = insert_item(
                    cursor=cursor,
                    seen_hashes=seen_hashes,
                    content_type="statute",
                    category=category,
                    title=chunk_title,
                    content=chunk,
                )

                if ok:
                    inserted += 1
                    print(f"Inserted statute {inserted}: {chunk_title[:70]}")

            except Exception as e:
                print("Insert law chunk failed:", e)

        time.sleep(0.8)

    return inserted


def scrape_cases(cursor, seen_hashes):
    print("\n==============================")
    print("SCRAPING CASES")
    print("==============================")

    inserted = 0

    for source in CASE_SOURCES:
        index_url = source["index_url"]
        court = source["court"]

        print(f"\nSource: {court}")
        case_urls = collect_case_urls_from_index(index_url, MAX_CASES_PER_SOURCE)

        print(f"Found case URLs: {len(case_urls)}")

        for case_index, case_url in enumerate(case_urls, start=1):
            html = get_page(case_url)

            if not html:
                continue

            title, text = extract_page_text(html)

            if len(text) < 400:
                print(f"Skipped case: {title} - too little text")
                continue

            category = detect_category(title, text)
            chunks = split_into_chunks(text, max_words=140)

            # Limit chunks per case to avoid huge DB during demo
            chunks = chunks[:4]

            print(f"[CASE {case_index}/{len(case_urls)}] {title}")
            print(f"Court: {court}")
            print(f"Category: {category}")
            print(f"Chunks: {len(chunks)}")

            for chunk_index, chunk in enumerate(chunks, start=1):
                chunk_title = f"{court} — {title} — Case Extract {chunk_index}"

                try:
                    ok = insert_item(
                        cursor=cursor,
                        seen_hashes=seen_hashes,
                        content_type="case",
                        category=category,
                        title=chunk_title,
                        content=chunk,
                    )

                    if ok:
                        inserted += 1
                        print(f"Inserted case {inserted}: {chunk_title[:70]}")

                except Exception as e:
                    print("Insert case chunk failed:", e)

            time.sleep(0.8)

    return inserted


def main():
    print("Connecting to PostgreSQL...")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    seen_hashes = set()

    total_laws = 0
    total_cases = 0

    try:
        total_laws = scrape_laws(cursor, seen_hashes)
        conn.commit()

        total_cases = scrape_cases(cursor, seen_hashes)
        conn.commit()

    except KeyboardInterrupt:
        print("Stopped by user. Saving already inserted data...")
        conn.commit()

    except Exception as e:
        print("Fatal scraper error:", e)
        conn.rollback()

    finally:
        cursor.close()
        conn.close()

    print("\nDONE")
    print(f"Total statute chunks inserted: {total_laws}")
    print(f"Total case chunks inserted: {total_cases}")


if __name__ == "__main__":
    main()