import os
import uuid
from typing import Optional

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun

from app.config import get_settings

settings = get_settings()

_embeddings: Optional[GoogleGenerativeAIEmbeddings] = None
_session_stores: dict[str, FAISS] = {}
_legal_store: Optional[FAISS] = None


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
        )
    return _embeddings


class MultiStoreRetriever(BaseRetriever):
    """Searches multiple FAISS stores and deduplicates results."""

    stores: list
    k: int = 5

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> list[Document]:
        seen, results = set(), []
        for store in self.stores:
            for doc in store.similarity_search(query, k=self.k):
                key = doc.page_content[:120]
                if key not in seen:
                    seen.add(key)
                    results.append(doc)
        return results[: self.k]

    async def _aget_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> list[Document]:
        return self._get_relevant_documents(query, run_manager=run_manager)


def load_legal_index() -> None:
    global _legal_store
    if os.path.exists(settings.LEGAL_INDEX_PATH):
        _legal_store = FAISS.load_local(
            settings.LEGAL_INDEX_PATH,
            get_embeddings(),
            allow_dangerous_deserialization=True,
        )
        print(f"[RAG] Legal index loaded from {settings.LEGAL_INDEX_PATH}")
    else:
        print("[RAG] No legal index found — run ingest_legal.py to build it")


def is_legal_index_loaded() -> bool:
    return _legal_store is not None


def create_session_store(documents: list[Document]) -> str:
    session_id = str(uuid.uuid4())
    _session_stores[session_id] = FAISS.from_documents(documents, get_embeddings())
    return session_id


def delete_session(session_id: str) -> None:
    _session_stores.pop(session_id, None)


def get_retriever(session_id: Optional[str], mode: str):
    """
    general mode → session store only
    legal mode   → legal index + optional session store (merged)
    """
    stores = []

    if mode == "legal" and _legal_store:
        stores.append(_legal_store)

    if session_id and session_id in _session_stores:
        stores.append(_session_stores[session_id])

    if not stores:
        return None

    if len(stores) == 1:
        return stores[0].as_retriever(search_kwargs={"k": settings.RETRIEVAL_K})

    return MultiStoreRetriever(stores=stores, k=settings.RETRIEVAL_K)