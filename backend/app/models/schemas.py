from pydantic import BaseModel
from typing import List
from enum import Enum


class ChatMode(str, Enum):
    general = "general"
    legal = "legal"


class ChatRequest(BaseModel):
    session_id: str
    message: str
    mode: ChatMode = ChatMode.general


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    mode: ChatMode


class UploadResponse(BaseModel):
    session_id: str
    filename: str
    chunks: int


class HealthResponse(BaseModel):
    status: str
    legal_index_loaded: bool
