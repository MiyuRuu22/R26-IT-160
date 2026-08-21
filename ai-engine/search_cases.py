import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# Load model
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Load FAISS index
index = faiss.read_index('faiss_index.bin')

# Load metadata
with open('metadata.json', 'r', encoding='utf-8') as f:
    cases = json.load(f)

# User query
query = input('Enter legal case description: ')

# Generate query embedding
query_embedding = model.encode([query])
query_embedding = np.array(query_embedding).astype('float32')

# Search similar cases
k = 3
D, I = index.search(query_embedding, k)

print('\nMost Similar Cases:\n')

for idx in I[0]:
    print('Title:', cases[idx]['title'])
    print('Summary:', cases[idx]['summary'])
    print('Outcome:', cases[idx]['outcome'])
    print('--------------------------')