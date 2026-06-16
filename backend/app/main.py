from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, documents
from app.services.vectorstore import load_legal_index, is_legal_index_loaded
from app.models.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_legal_index()
    yield


from app.config import get_settings

settings = get_settings()

app = FastAPI(title="RAG Portfolio API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", legal_index_loaded=is_legal_index_loaded())
