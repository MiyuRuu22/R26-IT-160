"""
embedder.py
===========
Reads clean_structured_law_dataset.csv, generates sentence embeddings using
all-MiniLM-L6-v2, and persists the FAISS index + metadata to vector_store/.

Run once (or whenever dataset changes):
    python embedder.py
"""

import os
import pickle
import sys

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

from config import Config


# ── helpers ───────────────────────────────────────────────────────────────────

def _log(msg: str) -> None:
    print(f"[embedder] {msg}", flush=True)


def _safe_str(value) -> str:
    """Return string representation of value, or empty string for nulls."""
    if pd.isna(value):
        return ""
    return str(value).strip()


def build_searchable_text(row: pd.Series) -> str:
    """
    Combines act_name + section_title + law_text into one rich text field
    for embedding.  Extra context from category / subcategory is prepended
    so the model understands the legal domain.
    """
    parts = []

    # Domain prefix for better semantic context
    category    = _safe_str(row.get("category", ""))
    subcategory = _safe_str(row.get("subcategory", ""))
    if category:
        parts.append(category)
    if subcategory:
        parts.append(subcategory)

    # Core fields
    for field in Config.TEXT_FIELDS:           # act_name, section_title, law_text
        val = _safe_str(row.get(field, ""))
        if val:
            parts.append(val)

    return " | ".join(parts)


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    # 1. Ensure output directory exists
    os.makedirs(Config.VECTOR_STORE_DIR, exist_ok=True)

    # 2. Load CSV
    _log(f"Loading dataset from: {Config.CSV_PATH}")
    if not os.path.exists(Config.CSV_PATH):
        _log(f"ERROR: CSV not found at {Config.CSV_PATH}")
        _log("Please place clean_structured_law_dataset.csv inside ai-engine/data/")
        sys.exit(1)

    df = pd.read_csv(Config.CSV_PATH, encoding="utf-8", low_memory=False)
    _log(f"Loaded {len(df):,} rows with columns: {list(df.columns)}")

    # Drop rows where law_text is completely missing
    before = len(df)
    df = df[df["law_text"].notna() & (df["law_text"].astype(str).str.strip() != "")]
    _log(f"After null-law_text drop: {len(df):,} rows (removed {before - len(df):,})")
    df = df.reset_index(drop=True)

    # 3. Build searchable text corpus
    _log("Building combined searchable text field …")
    df["_search_text"] = df.apply(build_searchable_text, axis=1)

    # 4. Build metadata list (one dict per row – what the API will return)
    metadata = []
    for idx, row in df.iterrows():
        metadata.append({
            "act_name":      _safe_str(row.get("act_name", "")),
            "act_no":        _safe_str(row.get("act_no", "")),
            "section":       _safe_str(row.get("section", "")),
            "section_title": _safe_str(row.get("section_title", "")),
            "category":      _safe_str(row.get("category", "")),
            "subcategory":   _safe_str(row.get("subcategory", "")),
            "legal_system":  _safe_str(row.get("legal_system", "")),
            "law_text":      _safe_str(row.get("law_text", "")),
        })

    # 5. Load sentence-transformer model
    _log(f"Loading embedding model: {Config.MODEL_NAME}")
    model = SentenceTransformer(Config.MODEL_NAME)

    # 6. Generate embeddings (batch for speed)
    texts = df["_search_text"].tolist()
    _log(f"Generating embeddings for {len(texts):,} laws …")
    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=True,
        convert_to_numpy=True,
    )
    embeddings = np.array(embeddings, dtype="float32")
    _log(f"Embedding shape: {embeddings.shape}")

    # 7. Normalise for cosine similarity via IndexFlatIP
    faiss.normalize_L2(embeddings)

    # 8. Build FAISS index (Inner Product = cosine after L2 normalisation)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)
    _log(f"FAISS index contains {index.ntotal:,} vectors (dim={dimension})")

    # 9. Persist index
    faiss.write_index(index, Config.FAISS_INDEX_PATH)
    _log(f"FAISS index saved -> {Config.FAISS_INDEX_PATH}")

    # 10. Persist metadata
    with open(Config.METADATA_PATH, "wb") as f:
        pickle.dump(metadata, f)
    _log(f"Metadata saved  -> {Config.METADATA_PATH}  ({len(metadata):,} records)")

    _log("Done! Run the API with:  uvicorn api_search:app --reload")


if __name__ == "__main__":
    main()
