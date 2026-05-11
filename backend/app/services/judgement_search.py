import os
import pickle
from pathlib import Path

import faiss
import torch
from transformers import AutoTokenizer, AutoModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent

MODEL_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "models", "sl_legalbert_model")
)

FAISS_FILE = os.path.abspath(
    os.path.join(BASE_DIR, "faiss_index", "judgements_faiss.index")
)

META_FILE = os.path.abspath(
    os.path.join(BASE_DIR, "faiss_index", "judgements_metadata.pkl")
)

MAX_LENGTH = 256

tokenizer = None
model = None
device = None
index = None
metadata = None

def mean_pooling(model_output, attention_mask):

    token_embeddings = model_output.last_hidden_state

    mask = attention_mask.unsqueeze(-1).expand(
        token_embeddings.size()
    ).float()

    return torch.sum(
        token_embeddings * mask,
        dim=1
    ) / torch.clamp(mask.sum(dim=1), min=1e-9)

def load_judgement_search():

    global tokenizer, model, device, index, metadata

    print("Loading judgement search engine...")

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

    model = AutoModel.from_pretrained(MODEL_PATH)

    model.to(device)
    model.eval()

    index = faiss.read_index(FAISS_FILE)

    with open(META_FILE, "rb") as f:
        metadata = pickle.load(f)

    print("Judgement search loaded")
    print("Total vectors:", index.ntotal)

def embed_text(text):

    encoded = tokenizer(
        text,
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt"
    )

    encoded = {
        k: v.to(device)
        for k, v in encoded.items()
    }

    with torch.no_grad():
        output = model(**encoded)

    embedding = mean_pooling(
        output,
        encoded["attention_mask"]
    )

    embedding = torch.nn.functional.normalize(
        embedding,
        p=2,
        dim=1
    )

    return embedding.cpu().numpy()

def search_judgements(query, top_k=5):

    query_embedding = embed_text(query)

    distances, indices = index.search(
        query_embedding,
        top_k
    )

    results = []

    for score, idx in zip(
        distances[0],
        indices[0]
    ):

        item = metadata[idx]

        results.append({
            "type": "judgement",
            "court": item.get("court"),
            "case_number": item.get("case_number"),
            "parties": item.get("parties"),
            "text": item.get("text"),
            "score": float(score)
        })

    return results