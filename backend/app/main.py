from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.judgement_search import load_judgement_search

from app.routes import suggestions
from app.services.semantic_search import load_search_engine

app = FastAPI(title="Legal Drafting Assistant API")

load_judgement_search()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    load_search_engine()


app.include_router(suggestions.router, prefix="/api")