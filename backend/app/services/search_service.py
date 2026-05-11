import os
import pickle
from pathlib import Path

import faiss
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent

FAISS_INDEX_FILE = os.path.abspath(
    os.path.join(BASE_DIR, "faiss_index", "legal_faiss.index")
)

META_FILE = os.path.abspath(
    os.path.join(BASE_DIR, "faiss_index", "legal_embedding_meta.pkl")
)

index = None
metadata = None


def load_legal_search():
    global index, metadata

    print("===== LOADING LEGAL FAISS SEARCH =====")
    print("FAISS:", FAISS_INDEX_FILE)
    print("META:", META_FILE)

    index = faiss.read_index(FAISS_INDEX_FILE)

    with open(META_FILE, "rb") as f:
        metadata = pickle.load(f)

    print("Legal FAISS loaded")
    print("Total law vectors:", index.ntotal)


def search_legal_content(query_embedding, top_k=10):
    if index is None or metadata is None:
        return []

    query_embedding = np.array(query_embedding).astype("float32")

    if len(query_embedding.shape) == 1:
        query_embedding = query_embedding.reshape(1, -1)

    scores, indices = index.search(query_embedding, top_k)

    results = []

    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(metadata):
            continue

        item = metadata[idx].copy()

        item["score"] = float(score)

        results.append(item)

    return results