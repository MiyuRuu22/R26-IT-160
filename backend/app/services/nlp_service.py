import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel

MODEL_NAME = "nlpaueb/legal-bert-base-uncased"

print("Loading LEGAL-BERT...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)
model.eval()
print("LEGAL-BERT loaded successfully")


def get_embedding(text: str) -> np.ndarray:
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512,
    )

    with torch.no_grad():
        outputs = model(**inputs)

    token_embeddings = outputs.last_hidden_state
    attention_mask = inputs["attention_mask"].unsqueeze(-1)

    masked_embeddings = token_embeddings * attention_mask
    summed = masked_embeddings.sum(dim=1)
    counts = attention_mask.sum(dim=1)

    mean_pooled = summed / counts

    return mean_pooled[0].cpu().numpy().astype("float32")