import os
import pickle
from pathlib import Path

import faiss
import torch
from transformers import AutoTokenizer, AutoModelForMaskedLM

BASE_DIR = Path(__file__).resolve().parent.parent.parent

MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "models", "sl_legalbert_model"))
FAISS_INDEX_FILE = os.path.abspath(os.path.join(BASE_DIR, "faiss_index", "legal_faiss.index"))
META_FILE = os.path.abspath(os.path.join(BASE_DIR, "faiss_index", "legal_embedding_meta.pkl"))

MAX_LENGTH = 512

tokenizer = None
model = None
device = None
index = None
metadata = None


def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output.last_hidden_state
    mask = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()

    return torch.sum(token_embeddings * mask, dim=1) / torch.clamp(
        mask.sum(dim=1),
        min=1e-9
    )


def get_value(item, keys, default=""):
    for key in keys:
        value = item.get(key)
        if value is not None and str(value).strip() != "":
            return value
    return default


def normalize_item(item, idx=None, score=None):
    section_no = get_value(
        item,
        [
            "section_no",
            "section",
            "section_number",
            "sec_no",
            "sec",
            "s_no",
            "clause_no",
            "paragraph_no",
        ],
        ""
    )

    section_title = get_value(
        item,
        [
            "section_title",
            "title",
            "heading",
            "section_heading",
            "name",
        ],
        ""
    )

    act_name = get_value(
        item,
        [
            "act_name",
            "act_title",
            "law_name",
            "document_title",
            "document_name",
            "source_title",
            "title",
        ],
        "Unknown Act"
    )

    act_no = get_value(
        item,
        [
            "act_no",
            "act_number",
            "act_num",
            "number",
            "law_no",
        ],
        ""
    )

    content = get_value(
        item,
        [
            "content",
            "text",
            "section_text",
            "body",
            "full_text",
            "chunk_text",
            "short_text",
        ],
        ""
    )

    short_text = get_value(
        item,
        [
            "short_text",
            "short_insert",
            "summary",
            "content",
            "text",
            "section_text",
        ],
        content
    )

    result = {
        "id": get_value(item, ["id", "law_id", "section_id"], idx if idx is not None else ""),
        "meta_index": idx,
        "act_name": act_name,
        "act_no": act_no,
        "section_no": section_no,
        "section_title": section_title,
        "category": get_value(item, ["category", "law_category"], "other"),
        "subcategory": get_value(item, ["subcategory", "sub_category"], ""),
        "short_text": short_text,
        "content": content,
        "source_url": get_value(item, ["source_url", "url", "pdf_url"], ""),
        "source_page": get_value(item, ["source_page", "page", "page_no"], ""),
        "debug_keys": list(item.keys()),
    }

    if score is not None:
        result["score"] = round(float(score), 4)

    return result


def load_search_engine():
    global tokenizer, model, device, index, metadata

    print("===== LOADING SEARCH ENGINE =====")
    print("MODEL_PATH:", MODEL_PATH)
    print("MODEL EXISTS:", os.path.exists(MODEL_PATH))
    print("FAISS EXISTS:", os.path.exists(FAISS_INDEX_FILE))
    print("META EXISTS:", os.path.exists(META_FILE))

    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=True)

    mlm_model = AutoModelForMaskedLM.from_pretrained(
        MODEL_PATH,
        local_files_only=True
    )

    model = mlm_model.bert
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model.to(device)
    model.eval()

    index = faiss.read_index(FAISS_INDEX_FILE)

    with open(META_FILE, "rb") as f:
        metadata = pickle.load(f)

    print("Semantic search engine loaded successfully.")
    print("Device:", device)
    print("Total indexed laws:", index.ntotal)

    if metadata and len(metadata) > 0:
        print("Sample metadata keys:", list(metadata[0].keys()))
        print("Sample metadata item:", metadata[0])

    print("================================")


def embed_query(text):
    encoded = tokenizer(
        [text],
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt"
    )

    encoded = {k: v.to(device) for k, v in encoded.items()}

    with torch.no_grad():
        output = model(**encoded)

    embedding = mean_pooling(output, encoded["attention_mask"])
    embedding = torch.nn.functional.normalize(embedding, p=2, dim=1)

    return embedding.cpu().numpy().astype("float32")


def search_legal_sections(text, category=None, limit=5):
    query_embedding = embed_query(text)

    scores, indices = index.search(query_embedding, 50)

    results = []

    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue

        item = metadata[idx]

        if category and category not in ["all", "other"]:
            item_category = item.get("category")
            if item_category and item_category != category:
                continue

        results.append(normalize_item(item, idx=int(idx), score=score))

        if len(results) >= limit:
            break

    return results


def get_law_detail_by_id(law_id: int):
    global metadata

    if metadata is None:
        return None

    for idx, item in enumerate(metadata):
        try:
            if int(get_value(item, ["id", "law_id", "section_id"], -1)) == int(law_id):
                return normalize_item(item, idx=idx)
        except Exception:
            pass

    try:
        idx = int(law_id)
        if 0 <= idx < len(metadata):
            return normalize_item(metadata[idx], idx=idx)
    except Exception:
        pass

    return None