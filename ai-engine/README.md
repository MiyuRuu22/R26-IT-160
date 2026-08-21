# Smart Lawyer AI Engine — v3.0

Dual semantic search backend for **Smart Lawyer Companion**:

| Endpoint | Dataset | Purpose |
|---|---|---|
| `POST /search` | Sri Lankan Legal Statutes (CSV) | Find relevant laws by query |
| `POST /search-cases` | LK Appeal Court Judgements (TSV, 10,693 cases) | Retrieve similar precedents |

Both powered by **FAISS + Sentence Transformers (all-MiniLM-L6-v2)** with cosine similarity.

---

## Project Structure

```
ai-engine/
├── data/
│   ├── clean_structured_law_dataset.csv   ← legal statutes
│   └── cases/
│       ├── docs_all.tsv                   ← 10,693 appeal court cases
│       └── docs_last1000.tsv              ← latest 1000 cases
├── vector_store/
│   ├── legal_index.faiss                  ← laws FAISS index
│   ├── legal_metadata.pkl                 ← laws metadata
│   ├── case_index.faiss                   ← cases FAISS index
│   └── case_metadata.pkl                  ← cases metadata (chunks)
├── embedder.py        ← generates laws index
├── case_embedder.py   ← generates cases index
├── api_search.py      ← FastAPI server (both endpoints)
├── config.py          ← all paths & settings
└── requirements.txt
```

---

## Setup

### 1. Install dependencies

```bash
cd SmartLawyerCompanion/ai-engine
pip install -r requirements.txt
```

---

## Step 1 — Build Laws Index

```bash
python embedder.py
```

Generates: `vector_store/legal_index.faiss` + `vector_store/legal_metadata.pkl`

---

## Step 2 — Build Cases Index

```bash
py case_embedder.py
```

Generates: `vector_store/case_index.faiss` + `vector_store/case_metadata.pkl`

> Takes ~15 minutes for 10,693 judgements on CPU.

---

## Step 3 — Run the API Server

```bash
py -m uvicorn api_search:app --reload --host 0.0.0.0 --port 8000
```

- API:  `http://0.0.0.0:8000`
- Docs: `http://0.0.0.0:8000/docs`
- Health: `GET http://0.0.0.0:8000/`

---

## API Reference

### `POST /search` — Legal Statutes

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"question": "fraud involving property"}'
```

**Request:**
```json
{
  "question": "fraud involving property",
  "top_k": 5,
  "category": "Criminal Law",
  "legal_system": "Sri Lanka"
}
```

**Response:**
```json
{
  "status": "success",
  "query": "fraud involving property",
  "total_results": 5,
  "results": [
    {
      "act_name": "Penal Code",
      "act_no": "No. 2 of 1883",
      "section": "403",
      "section_title": "Dishonest misappropriation of property",
      "category": "Criminal Law",
      "subcategory": "Offences against Property",
      "legal_system": "Sri Lanka",
      "law_text": "Whoever dishonestly misappropriates...",
      "similarity_score": 0.8921
    }
  ]
}
```

---

### `POST /search-cases` — Appeal Court Precedents

```bash
curl -X POST http://localhost:8000/search-cases \
  -H "Content-Type: application/json" \
  -d '{"question": "financial fraud involving forged documents"}'
```

**Request:**
```json
{
  "question": "financial fraud involving forged documents",
  "top_k": 5
}
```

**Response:**
```json
{
  "status": "success",
  "query": "financial fraud involving forged documents",
  "total_results": 5,
  "similar_cases": [
    {
      "filename": "2023-04-12-CA-HC-alt-0012-2019.txt",
      "case_id": "2023-04-12-CA-HC-alt-0012-2019",
      "chunk_text": "Parties: ...\nDescription: ...\nKeywords: fraud, forgery",
      "parties": "...",
      "description": "...",
      "judgement_by": "Hon. J. Seneviratne J.",
      "keywords": "fraud, forgery, forged documents",
      "legistation": "Penal Code Section 454",
      "num": "CA/HC/alt/0012/2019",
      "date_str": "2023-04-12",
      "url_pdf": "https://courtofappeal.lk/...",
      "similarity_score": 0.7634
    }
  ]
}
```

---

## Example Queries

```bash
# Murder / criminal cases
curl -X POST http://localhost:8000/search-cases -H "Content-Type: application/json" \
  -d '{"question": "murder culpable homicide sentence"}'

# Land acquisition disputes
curl -X POST http://localhost:8000/search-cases -H "Content-Type: application/json" \
  -d '{"question": "land acquisition state compulsory purchase"}'

# Right to information
curl -X POST http://localhost:8000/search-cases -H "Content-Type: application/json" \
  -d '{"question": "right to information access government records"}'

# Contract breach
curl -X POST http://localhost:8000/search -H "Content-Type: application/json" \
  -d '{"question": "breach of contract damages"}'
```

---

## Architecture Notes

- **Cosine similarity** via `IndexFlatIP` + L2-normalised vectors
- **Chunking**: 1500-char chunks with 150-char overlap for long documents
- **De-duplication**: `/search-cases` returns at most 1 result per case (best chunk)
- **CORS enabled** for React Native / web frontends
- **RAG-ready**: full `chunk_text` + `law_text` available for LLM context injection
