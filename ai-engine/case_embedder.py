"""
case_embedder.py
================
Reads Sri Lankan Appeal Court Judgement metadata from:
    data/cases/docs_all.tsv

Builds a combined searchable text per case from:
    parties + description + keywords + legistation + judgement_by

Chunks large texts, generates MiniLM embeddings, and saves to:
    vector_store/case_index.faiss
    vector_store/case_metadata.pkl

Run once (or whenever data changes):
    py case_embedder.py
"""

import os
import pickle
import sys
import re
import textwrap

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

from config import Config

# ── Logging ────────────────────────────────────────────────────────────────────
def _log(msg: str) -> None:
    print(f"[case_embedder] {msg}", flush=True)


# ── Text helpers ───────────────────────────────────────────────────────────────
def _safe(val) -> str:
    """Return clean string or empty for NaN/None."""
    if pd.isna(val):
        return ""
    return str(val).strip()


def build_case_text(row: pd.Series) -> str:
    """
    Combine all rich metadata fields into one semantic text block.
    Order: parties > description > keywords > legislation > judge.
    """
    parts = []
    for field, label in [
        ("parties",       "Parties"),
        ("description",   "Description"),
        ("keywords",      "Keywords"),
        ("legistation",   "Legislation"),
        ("judgement_by",  "Judge"),
        ("num",           "Case Number"),
        ("date_str",      "Date"),
    ]:
        val = _safe(row.get(field, ""))
        if val and val.lower() != "nan":
            parts.append(f"{label}: {val}")
    return "\n".join(parts)


def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> list[str]:
    """
    Split text into overlapping chunks of ~chunk_size characters.
    Overlap preserves context across chunk boundaries.
    Returns list of non-empty string chunks.
    """
    if len(text) <= chunk_size:
        return [text] if text.strip() else []

    chunks = []
    start  = 0
    while start < len(text):
        end = start + chunk_size
        # Try to break at sentence boundary
        if end < len(text):
            # Look back up to 200 chars for a '. ' or '\n'
            break_pos = max(text.rfind(". ", start, end), text.rfind("\n", start, end))
            if break_pos > start + (chunk_size // 2):
                end = break_pos + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap  # slide with overlap
        if start >= len(text):
            break

    return chunks


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    os.makedirs(Config.VECTOR_STORE_DIR, exist_ok=True)

    # 1. Load TSV
    tsv_path = os.path.join(Config.CASES_DIR, "docs_all.tsv")
    if not os.path.exists(tsv_path):
        _log(f"ERROR: TSV not found at {tsv_path}")
        _log("Run the download first or check data/cases/ folder.")
        sys.exit(1)

    _log(f"Loading {tsv_path} ...")
    df = pd.read_csv(tsv_path, sep="\t", low_memory=False, on_bad_lines="skip")
    _log(f"Loaded {len(df):,} judgements with columns: {list(df.columns)}")

    # Filter English only
    if "lang" in df.columns:
        df = df[df["lang"].fillna("en") == "en"]
        _log(f"English cases: {len(df):,}")

    df = df.reset_index(drop=True)

    # 2. Build case text + chunk
    _log("Building text and chunking ...")
    all_chunks = []     # list of dicts: {case_id, chunk_id, filename, chunk_text, metadata}

    for idx, row in df.iterrows():
        case_text = build_case_text(row)
        if not case_text.strip():
            continue

        chunks = chunk_text(case_text, chunk_size=1500, overlap=150)
        doc_id = _safe(row.get("doc_id", f"case_{idx}"))

        for cid, chunk in enumerate(chunks):
            all_chunks.append({
                "case_id":      doc_id,
                "chunk_id":     cid,
                "filename":     f"{doc_id}.txt",
                "chunk_text":   chunk,
                # Rich metadata for API response
                "parties":      _safe(row.get("parties", "")),
                "description":  _safe(row.get("description", "")),
                "judgement_by": _safe(row.get("judgement_by", "")),
                "keywords":     _safe(row.get("keywords", "")),
                "legistation":  _safe(row.get("legistation", "")),
                "num":          _safe(row.get("num", "")),
                "date_str":     _safe(row.get("date_str", "")),
                "url_pdf":      _safe(row.get("url_pdf", "")),
            })

    _log(f"Total chunks: {len(all_chunks):,} from {len(df):,} cases")

    # 3. Load model
    _log(f"Loading model: {Config.MODEL_NAME}")
    model = SentenceTransformer(Config.MODEL_NAME)

    # 4. Generate embeddings
    texts = [c["chunk_text"] for c in all_chunks]
    _log(f"Generating embeddings for {len(texts):,} chunks ...")
    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=True,
        convert_to_numpy=True,
    )
    embeddings = np.array(embeddings, dtype="float32")
    faiss.normalize_L2(embeddings)
    _log(f"Embedding shape: {embeddings.shape}")

    # 5. Build FAISS index (cosine similarity via normalised IP)
    dim   = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    _log(f"FAISS index: {index.ntotal:,} vectors (dim={dim})")

    # 6. Save
    faiss.write_index(index, Config.CASE_FAISS_INDEX_PATH)
    _log(f"FAISS index saved -> {Config.CASE_FAISS_INDEX_PATH}")

    with open(Config.CASE_METADATA_PATH, "wb") as f:
        pickle.dump(all_chunks, f)
    _log(f"Metadata saved  -> {Config.CASE_METADATA_PATH} ({len(all_chunks):,} chunks)")

    _log("Done! Run: py -m uvicorn api_search:app --reload --host 0.0.0.0 --port 8000")


if __name__ == "__main__":
    main()
