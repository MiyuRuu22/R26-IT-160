import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    # ── Model ─────────────────────────────────────────────────────────────────
    MODEL_NAME = "all-MiniLM-L6-v2"

    # ── Directories ───────────────────────────────────────────────────────────
    DATA_DIR         = os.path.join(BASE_DIR, "data")
    VECTOR_STORE_DIR = os.path.join(BASE_DIR, "vector_store")

    # ── Laws dataset (CSV) ────────────────────────────────────────────────────
    CSV_PATH         = os.path.join(DATA_DIR, "clean_structured_law_dataset.csv")
    FAISS_INDEX_PATH = os.path.join(VECTOR_STORE_DIR, "legal_index.faiss")
    METADATA_PATH    = os.path.join(VECTOR_STORE_DIR, "legal_metadata.pkl")

    # ── Cases dataset (TSV) ───────────────────────────────────────────────────
    CASES_DIR            = os.path.join(DATA_DIR, "cases")
    CASE_FAISS_INDEX_PATH = os.path.join(VECTOR_STORE_DIR, "case_index.faiss")
    CASE_METADATA_PATH    = os.path.join(VECTOR_STORE_DIR, "case_metadata.pkl")

    # ── Search ────────────────────────────────────────────────────────────────
    TOP_K_RESULTS = 5

    # ── Laws CSV columns ─────────────────────────────────────────────────────
    TEXT_FIELDS = ["act_name", "section_title", "law_text"]
