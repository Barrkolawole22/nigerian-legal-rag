from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services.vectorstore import get_retriever
from app.services.rag import query

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    retriever = get_retriever(request.session_id, request.mode.value)

    if retriever is None:
        detail = (
            "No document uploaded for this session."
            if request.mode == "general"
            else "Legal index not loaded. Add PDFs to data/statutes/ and run ingest_legal.py."
        )
        raise HTTPException(status_code=404, detail=detail)

    result = query(
        question=request.message,
        retriever=retriever,
        session_id=request.session_id,
        mode=request.mode.value,
    )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        mode=request.mode,
    )
