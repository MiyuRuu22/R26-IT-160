import requests
from bs4 import BeautifulSoup
import psycopg2
import json
import sys
import os
import time
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.nlp_service import get_embedding


DATABASE_URL = "postgresql://postgres:82720894@localhost:5432/legaldb"


LAW_SOURCES = [
    {
        "url": "https://www.commonlii.org/lk/legis/num_act/pc1883106/",
        "category": "criminal",
        "title": "Penal Code",
    },
    {
        "url": "https://www.commonlii.org/lk/legis/num_act/cpc1979237/",
        "category": "civil",
        "title": "Civil Procedure Code",
    },
    {
        "url": "https://www.commonlii.org/lk/legis/num_act/co1866141/",
        "category": "contract",
        "title": "Contracts Ordinance",
    },
    {
        "url": "https://www.commonlii.org/lk/legis/num_act/pfo1840232/",
        "category": "property",
        "title": "Prevention of Frauds Ordinance",
    },
    {
        "url": "https://www.commonlii.org/lk/legis/num_act/mro1951231/",
        "category": "family",
        "title": "Matrimonial Rights Ordinance",
    },
]


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = text.replace("\xa0", " ")
    return text.strip()


def split_into_chunks(text: str, max_words: int = 120):
    words = text.split()

    chunks = []

    for i in range(0, len(words), max_words):
        chunk_words = words[i:i + max_words]
        chunk = " ".join(chunk_words).strip()

        if len(chunk) > 80:
            chunks.append(chunk)

    return chunks


def scrape_law_page(url: str):
    headers = {
        "User-Agent": "Mozilla/5.0 LegalDraftResearchBot/1.0"
    }

    print(f"Requesting: {url}")

    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    text = soup.get_text(" ")
    text = clean_text(text)

    return text


def insert_legal_content(cursor, content_type, category, title, content):
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

    for source in LAW_SOURCES:
        try:
            law_title = source["title"]
            category = source["category"]
            url = source["url"]

            print("\n================================")
            print(f"Scraping law: {law_title}")
            print(f"Category: {category}")
            print("================================")

            full_text = scrape_law_page(url)

            if len(full_text) < 200:
                print(f"Skipped {law_title}: too little text found.")
                continue

            chunks = split_into_chunks(full_text, max_words=120)

            print(f"Found {len(chunks)} chunks.")

            for index, chunk in enumerate(chunks, start=1):
                chunk_title = f"{law_title} — Part {index}"

                print(f"Embedding and inserting: {chunk_title}")

                insert_legal_content(
                    cursor=cursor,
                    content_type="statute",
                    category=category,
                    title=chunk_title,
                    content=chunk,
                )

                total_inserted += 1

                if total_inserted % 10 == 0:
                    conn.commit()
                    print(f"Committed {total_inserted} records...")

            conn.commit()

            print(f"Finished: {law_title}")

            time.sleep(2)

        except Exception as error:
            print(f"Error scraping {source['title']}: {error}")
            conn.rollback()

    cursor.close()
    conn.close()

    print("\nDone.")
    print(f"Total inserted: {total_inserted}")


if __name__ == "__main__":
    main()