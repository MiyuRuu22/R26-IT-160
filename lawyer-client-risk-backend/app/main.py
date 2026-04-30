from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.search import router as search_router
from app.routes.clients import router as clients_router
from app.routes.reports import router as reports_router

app = FastAPI(title="Lawyer Client Risk Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(clients_router)
app.include_router(reports_router)


@app.get("/")
def root():
    return {"message": "Backend is running"}