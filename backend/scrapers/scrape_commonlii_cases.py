import requests
from bs4 import BeautifulSoup
import psycopg2
import json
import sys
import os
import time
import re
from urllib.parse import urljoin

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding


DATABASE_URL = "postgresql://postgres:82720894@localhost:5432/legaldb"


CASE_SOURCES = [
    {
        "url": "https://www.commonlii.org/lk/cases/LKSC/",
        "category": "criminal",
        "court": "Supreme Court",
        "limit": 20,
    },
    {
        "url": "https://www.commonlii.org/lk/cases/LKCA/",
        "category": "civil",
        "court": "Court of Appeal",
        "limit": 20,
    },
]


def clean_text(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_into_chunks(text: str, max_words: int = 140):
    words = text.split()
    chunks = []

    for i in range(0, len(words), max_words):
        chunk_words = words[i:i + max_words]
        chunk = " ".join(chunk_words).strip()

        if len(chunk) > 120:
            chunks.append(chunk)

    return chunks


def get_case_links(source_url: str, limit: int):
    headers = {
        "User-Agent": "Mozilla/5.0 LegalDraftResearchBot/1.0"
    }

    print(f"Finding case links from: {source_url}")

    response = requests.get(source_url, headers=headers, timeout=20)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    links = []

    for a in soup.find_all("a", href=True):
        href = a["href"]

        if href.endswith(".html"):
            full_url = urljoin(source_url, href)

            if full_url not in links:
                links.append(full_url)

    return links[:limit]


def scrape_case_page(case_url: str):
    headers = {
        "User-Agent": "Mozilla/5.0 LegalDraftResearchBot/1.0"
    }

    print(f"Scraping case: {case_url}")

    response = requests.get(case_url, headers=headers, timeout=20)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    title_tag = soup.find("title")
    title = title_tag.get_text(" ", strip=True) if title_tag else "Unknown Case"

    body_text = soup.get_text(" ")
    body_text = clean_text(body_text)

    return title[:500], body_text


def insert_case_content(cursor, category, title, content):
    embedding = get_embedding(content)
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
            title,
            content,
            embedding_json,
        )
    )


def main():
    print("Connecting to PostgreSQL...")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    total_inserted = 0

    for source in CASE_SOURCES:
        try:
            source_url = source["url"]
            category = source["category"]
            court = source["court"]
            limit = source["limit"]

            print("\n================================")
            print(f"Source: {court}")
            print(f"Category: {category}")
            print("================================")

            case_links = get_case_links(source_url, limit)

            print(f"Found {len(case_links)} case links.")

            for case_index, case_url in enumerate(case_links, start=1):
                try:
                    title, full_text = scrape_case_page(case_url)

                    if len(full_text) < 300:
                        print(f"Skipped case {case_index}: too little text.")
                        continue

                    chunks = split_into_chunks(full_text, max_words=140)

                    if not chunks:
                        print(f"Skipped case {case_index}: no valid chunks.")
                        continue

                    # For demo, do not insert too many chunks per judgment
                    chunks = chunks[:3]

                    for chunk_index, chunk in enumerate(chunks, start=1):
                        case_title = f"{court} — {title} — Extract {chunk_index}"

                        print(f"Embedding and inserting: {case_title[:80]}")

                        insert_case_content(
                            cursor=cursor,
                            category=category,
                            title=case_title,
                            content=chunk,
                        )

                        total_inserted += 1

                        if total_inserted % 10 == 0:
                            conn.commit()
                            print(f"Committed {total_inserted} records...")

                    conn.commit()
                    time.sleep(1)

                except Exception as case_error:
                    print(f"Error scraping case page: {case_error}")
                    conn.rollback()

            print(f"Finished source: {court}")

        except Exception as source_error:
            print(f"Error with source {source['court']}: {source_error}")
            conn.rollback()

    cursor.close()
    conn.close()

    print("\nDone.")
    print(f"Total case extracts inserted: {total_inserted}")


if __name__ == "__main__":
    main()