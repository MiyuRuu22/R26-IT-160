"""Full end-to-end pipeline simulation (no HTTP) to find the 500 error source."""
import os, pickle, traceback
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from config import Config
from legal_classifier import classify_legal_issue

os.environ["TOKENIZERS_PARALLELISM"] = "false"

print("Loading model and index...")
model = SentenceTransformer(Config.MODEL_NAME)
law_index = faiss.read_index(Config.FAISS_INDEX_PATH)
with open(Config.METADATA_PATH, "rb") as f:
    law_metadata = pickle.load(f)

MIN_FILTER_SIZE = 10

def _embed(text):
    vec = model.encode([text], convert_to_numpy=True).astype("float32")
    faiss.normalize_L2(vec)
    return vec

def _build_sub_index(global_indices):
    if not global_indices or law_index is None:
        return None
    try:
        dim = law_index.d
        sub_vectors = np.zeros((len(global_indices), dim), dtype="float32")
        for local_i, global_i in enumerate(global_indices):
            law_index.reconstruct(global_i, sub_vectors[local_i])
        sub_index = faiss.IndexFlatIP(dim)
        sub_index.add(sub_vectors)
        return sub_index, global_indices
    except Exception as exc:
        print(f"Sub-index error: {exc}")
        return None

def _filter_law_indices(allowed_categories):
    return [
        idx for idx, rec in enumerate(law_metadata)
        if rec.get("category", "unknown") in allowed_categories
    ]

question = "Alleged drug trafficking and criminal conspiracy"
top_k = 3

try:
    print("Classifying...")
    classification = classify_legal_issue(question)
    print("Classification:", classification)

    allowed_cats = classification["allowed_categories"]
    filtered_indices = _filter_law_indices(allowed_cats)
    laws_in_filter = len(filtered_indices)
    print(f"Filtered: {laws_in_filter} laws")

    search_mode = "filtered"
    working_index = None
    index_map = []

    if laws_in_filter >= MIN_FILTER_SIZE and not classification["fallback"]:
        result = _build_sub_index(filtered_indices)
        if result is not None:
            working_index, index_map = result
            print(f"Sub-index has {len(index_map)} vectors")
        else:
            search_mode = "full_corpus"
    else:
        search_mode = "full_corpus"

    if search_mode == "full_corpus":
        working_index = law_index
        index_map = list(range(len(law_metadata)))

    print(f"Search mode: {search_mode}")
    vec = _embed(question)
    fetch_k = min(top_k * 10, working_index.ntotal)
    scores, local_indices = working_index.search(vec, fetch_k)
    print("Search complete, local_indices shape:", local_indices.shape)

    results = []
    seen_acts = set()

    for rank in range(len(local_indices[0])):
        local_idx = int(local_indices[0][rank])
        score = float(scores[0][rank])
        if local_idx < 0 or local_idx >= len(index_map):
            continue
        global_idx = index_map[local_idx]
        if global_idx >= len(law_metadata):
            continue
        rec = law_metadata[global_idx]
        dedup_key = (rec.get("act_name", ""), rec.get("section", ""))
        if dedup_key in seen_acts:
            continue
        seen_acts.add(dedup_key)
        results.append({
            "act_name": rec.get("act_name", ""),
            "category": rec.get("category", ""),
            "similarity_score": round(score, 4),
        })
        if len(results) >= top_k:
            break

    print("\n=== RESULTS ===")
    print(f"Detected: {classification['issue_label']} ({classification['confidence']*100:.0f}%)")
    print(f"Mode: {search_mode}")
    print(f"Filtered: {laws_in_filter}")
    print(f"Categories: {', '.join(allowed_cats)}")
    print(f"Keywords: {classification['matched_keywords']}")
    print()
    for i, r in enumerate(results):
        print(f"  {i+1}. [{r['category']}] {r['act_name'][:70]} ({r['similarity_score']*100:.0f}%)")

except Exception as e:
    traceback.print_exc()


# Load AI Embedding Model
#        ↓
# Load FAISS Vector Index
#        ↓
# Load Legal Metadata
#        ↓
# Receive Legal Question/Input
#        ↓
# Classify Legal Issue Category
#        ↓
# Filter Relevant Legal Categories
#        ↓
# Build Temporary Sub-Index
#        ↓
# Generate Question Embedding
#        ↓
# Perform Semantic Similarity Search
#        ↓
# Retrieve Most Relevant Legal Records
#        ↓
# Remove Duplicate Legal Acts
#        ↓
# Generate Ranked Legal Results
#        ↓
# Display Similar Legal Acts & Scores