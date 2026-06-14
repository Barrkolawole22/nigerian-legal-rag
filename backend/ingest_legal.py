"""
Drop Nigerian statute PDFs into data/statutes/ then run:
    python ingest_legal.py
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from pypdf import PdfReader

load_dotenv()

STATUTES_DIR = Path("data/statutes")
INDEX_PATH = "indexes/legal"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def main():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set in .env")

    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=api_key,
    )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    documents: list[Document] = []

    for pdf in sorted(STATUTES_DIR.glob("*.pdf")):
        print(f"  Processing {pdf.name}...")
        reader = PdfReader(str(pdf))
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if not text.strip():
                continue
            for chunk in splitter.split_text(text):
                documents.append(
                    Document(
                        page_content=chunk,
                        metadata={"source": pdf.name, "page": i},
                    )
                )

    if not documents:
        print("No PDFs found in data/statutes/. Add your statute PDFs and rerun.")
        return

    print(f"\nBuilding FAISS index from {len(documents)} chunks...")
    store = FAISS.from_documents(documents, embeddings)

    os.makedirs(INDEX_PATH, exist_ok=True)
    store.save_local(INDEX_PATH)
    print(f"Done. Index saved to {INDEX_PATH}/")


if __name__ == "__main__":
    main()