from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import ConversationalRetrievalChain
from langchain_classic.memory import ConversationBufferMemory
from langchain_core.prompts import PromptTemplate
from langchain_core.retrievers import BaseRetriever

from app.config import get_settings

settings = get_settings()

_llm: Optional[ChatGoogleGenerativeAI] = None
_memories: dict[str, ConversationBufferMemory] = {}

PROMPTS: dict[str, PromptTemplate] = {
    "general": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "Answer the question using only the document context below.\n"
            "If the answer is not in the context, say so clearly.\n\n"
            "Context:\n{context}\n\n"
            "Question: {question}\n\n"
            "Answer:"
        ),
    ),
    "legal": PromptTemplate(
        input_variables=["context", "question"],
        template=(
            "You are a Nigerian legal research assistant.\n"
            "Answer using the statutes and case law provided below.\n"
            "Cite specific sections, acts, or cases where relevant.\n"
            "If the answer is not in the context, say so.\n\n"
            "Context:\n{context}\n\n"
            "Question: {question}\n\n"
            "Answer:"
        ),
    ),
}


def get_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.2,
            convert_system_message_to_human=True,
        )
    return _llm


def get_or_create_memory(session_id: str) -> ConversationBufferMemory:
    if session_id not in _memories:
        _memories[session_id] = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer",
        )
    return _memories[session_id]


def clear_memory(session_id: str) -> None:
    _memories.pop(session_id, None)


def query(
    question: str,
    retriever: BaseRetriever,
    session_id: str,
    mode: str = "general",
) -> dict:
    chain = ConversationalRetrievalChain.from_llm(
        llm=get_llm(),
        retriever=retriever,
        memory=get_or_create_memory(session_id),
        combine_docs_chain_kwargs={"prompt": PROMPTS[mode]},
        return_source_documents=True,
        get_chat_history=lambda h: "",
        verbose=False,
    )

    result = chain.invoke({"question": question})

    sources = []
    for doc in result.get("source_documents", []):
        src = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page", "")
        label = src + (f" (p.{page + 1})" if page != "" else "")
        sources.append(label)

    return {
        "answer": result["answer"],
        "sources": list(dict.fromkeys(sources)),  # deduplicate, preserve order
    }