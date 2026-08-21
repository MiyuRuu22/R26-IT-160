import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from config import Config
from preprocessing.clean_text import clean_text
from preprocessing.normalize import normalize_text
from utils.logger import setup_logger

logger = setup_logger("generate_embeddings")

def main():
    logger.info("Initializing embedding generation...")
    
    # Load model
    logger.info(f"Loading model: {Config.MODEL_NAME}")
    model = SentenceTransformer(Config.MODEL_NAME)
    
    # Load legal cases
    logger.info(f"Loading dataset from {Config.DATA_PATH}")
    try:
        with open(Config.DATA_PATH, 'r', encoding='utf-8') as f:
            cases = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load dataset: {str(e)}")
        return

    # Extract and preprocess summaries
    logger.info("Preprocessing text data...")
    texts = []
    for case in cases:
        # Combine summary and legal issues for richer embeddings
        combined_text = f"{case.get('summary', '')} {' '.join(case.get('legal_issues', []))}"
        cleaned = clean_text(combined_text)
        normalized = normalize_text(cleaned)
        texts.append(normalized)

    # Generate embeddings
    logger.info("Generating embeddings. This may take a moment...")
    embeddings = model.encode(texts)
    
    # Convert to numpy
    embeddings = np.array(embeddings).astype('float32')
    
    # Create FAISS index
    logger.info("Creating FAISS index...")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    
    # Save index
    logger.info(f"Saving FAISS index to {Config.FAISS_INDEX_PATH}")
    faiss.write_index(index, Config.FAISS_INDEX_PATH)
    
    # Save metadata
    logger.info(f"Saving metadata to {Config.METADATA_PATH}")
    with open(Config.METADATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(cases, f, indent=2)
        
    logger.info("Embeddings generated and index saved successfully!")

if __name__ == "__main__":
    main()