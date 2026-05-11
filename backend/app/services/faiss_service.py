import os
import json
import faiss
import numpy as np
import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env"))

DB_URL = os.getenv("DATABASE_URL")

indexes = {}
metadata = {}


def get_connection():
    if not DB_URL:
        raise Exception("DATABASE_URL is not loaded")
    return psycopg2.connect(DB_URL)


def normalize_vector(vec: np.ndarray):
    vec = vec.astype("float32")
    norm = np.linalg.norm(vec)

    if norm == 0:
        return vec

    return vec / norm


def build_faiss_index():
    global indexes, metadata

    print("Building FAISS index...")

    indexes = {}
    metadata = {}

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            id,
            content_type,
            category,
            title,
            content,
            embedding,
            short_text,
            act_name,
            act_no,
            section_number
        FROM legal_content
        WHERE embedding IS NOT NULL
        """
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    grouped = {}

    for row in rows:
        category = row[2]

        try:
            embedding = np.array(json.loads(row[5]), dtype="float32")
            embedding = normalize_vector(embedding)

            if category not in grouped:
                grouped[category] = []

            grouped[category].append({
                "id": row[0],
                "type": row[1],
                "category": row[2],
                "title": row[3],
                "content": row[4],
                "embedding": embedding,
                "short_text": row[6],
                "act_name": row[7],
                "act_no": row[8],
                "section_number": row[9],
            })

        except Exception as e:
            print("Skipping bad embedding:", e)

    for category, items in grouped.items():
        vectors = np.array([item["embedding"] for item in items], dtype="float32")

        if len(vectors) == 0:
            continue

        dimension = vectors.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(vectors)

        indexes[category] = index
        metadata[category] = items

        print(f"FAISS index built for {category}: {len(items)} items")

    print("FAISS build complete")


def search_faiss(query_embedding: np.ndarray, category: str, top_k: int = 5):
    if not indexes:
        build_faiss_index()

    if category not in indexes:
        return []

    query = normalize_vector(query_embedding)
    query = np.array([query], dtype="float32")

    index = indexes[category]
    items = metadata[category]

    scores, indices = index.search(query, min(top_k, len(items)))

    results = []

    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue

        item = items[idx]

        insert_text = item["short_text"] or item["title"]

        results.append({
            "id": item["id"],
            "type": item["type"],
            "category": item["category"],
            "title": insert_text,
            "content": insert_text,
            "score": float(score),
            "act_name": item["act_name"],
            "act_no": item["act_no"],
            "section_number": item["section_number"],
        })

    return results