import json
import os
from pathlib import Path
from typing import Any

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings


VECTORSTORE_DIR = Path("app/storage/vectorstore")
OPENAI_API_KEY_PLACEHOLDER = "sua_chave_aqui"


def load_chunks_from_json(chunks_file: str) -> dict[str, Any]:
    path = Path(chunks_file)

    if not path.exists():
        raise ValueError("Arquivo de chunks nao encontrado.")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def create_documents_from_chunks(chunks_payload: dict[str, Any]) -> list[Document]:
    documents = []

    document_id = chunks_payload["document_id"]
    source_file_path = chunks_payload["source_file_path"]

    for chunk in chunks_payload["chunks"]:
        documents.append(
            Document(
                page_content=chunk["content"],
                metadata={
                    "document_id": document_id,
                    "source_file_path": source_file_path,
                    "chunk_index": chunk["chunk_index"],
                    "page": chunk["page"],
                    "char_count": chunk["char_count"],
                },
            )
        )

    return documents


def validate_openai_api_key() -> None:
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key or api_key == OPENAI_API_KEY_PLACEHOLDER:
        raise ValueError(
            "OPENAI_API_KEY nao configurada. Defina uma chave valida em backend/.env."
        )


def index_chunks_in_vectorstore(chunks_file: str) -> dict[str, Any]:
    chunks_payload = load_chunks_from_json(chunks_file)
    documents = create_documents_from_chunks(chunks_payload)

    if not documents:
        raise ValueError("Nenhum documento encontrado para indexacao.")

    validate_openai_api_key()

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
    )

    collection_name = f"manual_{chunks_payload['document_id'].replace('-', '_')}"

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(VECTORSTORE_DIR),
    )

    try:
        vectorstore.add_documents(documents)
    except Exception as error:
        raise ValueError(
            f"Falha ao indexar chunks no vector store: {error}"
        ) from error

    return {
        "document_id": chunks_payload["document_id"],
        "collection_name": collection_name,
        "total_documents": len(documents),
        "vectorstore_dir": str(VECTORSTORE_DIR),
    }
