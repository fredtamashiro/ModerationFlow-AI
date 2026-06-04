import hashlib
import json
from pathlib import Path
from typing import Any

import chromadb
from sqlalchemy import text

from app.config import get_settings
from app.database.database import SessionLocal

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings


VECTORSTORE_DIR = Path("app/storage/vectorstore")
DB_CHUNKS_URI_PREFIX = "db://chunks/"
DB_ENRICHED_CHUNKS_URI_PREFIX = "db://enriched_chunks/"
OPENAI_API_KEY_PLACEHOLDER = "sua_chave_aqui"
EMBEDDING_BATCH_MAX_DOCUMENTS = 100
EMBEDDING_BATCH_MAX_CHARS = 200_000


def load_chunks_from_json(chunks_file: str) -> dict[str, Any]:
    if chunks_file.startswith(DB_CHUNKS_URI_PREFIX):
        document_id = chunks_file.removeprefix(DB_CHUNKS_URI_PREFIX)
        return load_chunks_from_db(document_id)

    path = Path(chunks_file)

    if not path.exists():
        raise ValueError("Arquivo de chunks nao encontrado.")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_chunks_from_db(document_id: str) -> dict[str, Any]:
    with SessionLocal() as db:
        document_row = db.execute(
            text(
                """
                SELECT id, file_path, total_chunks
                FROM smartdocs.documents
                WHERE id = CAST(:document_id AS UUID)
                """
            ),
            {"document_id": document_id},
        ).fetchone()

        if document_row is None:
            raise ValueError("Documento de chunks nao encontrado no banco.")

        chunk_rows = db.execute(
            text(
                """
                SELECT
                    chunk_index,
                    page,
                    content,
                    char_count,
                    chunk_strategy,
                    metadata
                FROM smartdocs.chunks
                WHERE document_id = CAST(:document_id AS UUID)
                ORDER BY chunk_index ASC
                """
            ),
            {"document_id": document_id},
        ).fetchall()

    document = document_row._mapping

    chunks = []
    for row in chunk_rows:
        chunk = row._mapping
        chunks.append(
            {
                "chunk_index": chunk["chunk_index"],
                "page": chunk["page"],
                "content": chunk["content"],
                "char_count": chunk["char_count"],
                "chunk_strategy": chunk["chunk_strategy"],
                "metadata": chunk["metadata"] or {},
            }
        )

    return {
        "document_id": str(document["id"]),
        "source_file_path": document["file_path"],
        "chunk_strategy": "recursive_character",
        "total_chunks": document["total_chunks"] or len(chunks),
        "chunks": chunks,
    }


def load_enriched_chunks_payload(enriched_chunks_file: str) -> dict[str, Any]:
    if enriched_chunks_file.startswith(DB_ENRICHED_CHUNKS_URI_PREFIX):
        document_id = enriched_chunks_file.removeprefix(
            DB_ENRICHED_CHUNKS_URI_PREFIX
        ).split("/", maxsplit=1)[0]
        return load_enriched_chunks_from_db(document_id)

    path = Path(enriched_chunks_file)

    if not path.exists():
        raise ValueError("Arquivo de chunks enriquecidos nao encontrado.")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_enriched_chunks_from_db(document_id: str) -> dict[str, Any]:
    with SessionLocal() as db:
        document_row = db.execute(
            text(
                """
                SELECT
                    id,
                    file_path,
                    chunks_file,
                    total_chunks,
                    theme_id,
                    theme_name
                FROM smartdocs.documents
                WHERE id = CAST(:document_id AS UUID)
                """
            ),
            {"document_id": document_id},
        ).fetchone()

        if document_row is None:
            raise ValueError("Documento enriquecido nao encontrado no banco.")

        enriched_rows = db.execute(
            text(
                """
                SELECT
                    ec.chunk_index,
                    ec.page,
                    ec.content,
                    c.char_count,
                    c.chunk_strategy,
                    ec.is_valid,
                    ec.quality_score,
                    ec.title,
                    ec.summary,
                    ec.category,
                    ec.keywords,
                    ec.possible_questions,
                    ec.warnings,
                    ec.embedding_content,
                    ec.metadata
                FROM smartdocs.enriched_chunks ec
                LEFT JOIN smartdocs.chunks c
                    ON c.document_id = ec.document_id
                    AND c.chunk_index = ec.chunk_index
                WHERE ec.document_id = CAST(:document_id AS UUID)
                ORDER BY ec.chunk_index ASC
                """
            ),
            {"document_id": document_id},
        ).fetchall()

    document = document_row._mapping

    chunks = []
    for row in enriched_rows:
        chunk = row._mapping
        content = chunk["content"] or ""
        chunks.append(
            {
                "chunk_index": chunk["chunk_index"],
                "page": chunk["page"],
                "content": content,
                "char_count": chunk["char_count"] or len(content),
                "chunk_strategy": chunk["chunk_strategy"] or "unknown",
                "enrichment": {
                    "is_valid": chunk["is_valid"],
                    "quality_score": float(chunk["quality_score"] or 0),
                    "title": chunk["title"],
                    "summary": chunk["summary"],
                    "category": chunk["category"],
                    "keywords": chunk["keywords"] or [],
                    "possible_questions": chunk["possible_questions"] or [],
                    "warnings": chunk["warnings"] or [],
                },
                "embedding_content": chunk["embedding_content"],
                "metadata": chunk["metadata"] or {},
            }
        )

    return {
        "document_id": str(document["id"]),
        "source_file_path": document["file_path"],
        "original_chunks_file": document["chunks_file"],
        "total_original_chunks": document["total_chunks"] or len(chunks),
        "total_enriched_chunks": len(chunks),
        "enrichment_mode": "full",
        "chunks": chunks,
        "theme_id": document["theme_id"],
        "theme_name": document["theme_name"],
    }


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
                    "chunk_strategy": chunk.get("chunk_strategy", "unknown"),
                },
            )
        )

    return documents


def add_documents_in_embedding_batches(
    vectorstore: Chroma,
    documents: list[Document],
) -> None:
    batch = []
    batch_chars = 0

    for document in documents:
        document_chars = len(document.page_content)

        if batch and (
            len(batch) >= EMBEDDING_BATCH_MAX_DOCUMENTS
            or batch_chars + document_chars > EMBEDDING_BATCH_MAX_CHARS
        ):
            vectorstore.add_documents(batch)
            batch = []
            batch_chars = 0

        batch.append(document)
        batch_chars += document_chars

    if batch:
        vectorstore.add_documents(batch)


def validate_openai_api_key() -> str:
    try:
        settings = get_settings()
    except Exception as error:
        raise ValueError(
            "OPENAI_API_KEY nao configurada. Defina uma chave valida em backend/.env."
        ) from error

    api_key = settings.openai_api_key

    if not api_key or api_key == OPENAI_API_KEY_PLACEHOLDER:
        raise ValueError(
            "OPENAI_API_KEY nao configurada. Defina uma chave valida em backend/.env."
        )

    return api_key


def index_chunks_in_vectorstore(chunks_file: str) -> dict[str, Any]:
    chunks_payload = load_chunks_from_json(chunks_file)
    documents = create_documents_from_chunks(chunks_payload)

    if not documents:
        raise ValueError("Nenhum documento encontrado para indexacao.")

    api_key = validate_openai_api_key()

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    settings = get_settings()

    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        openai_api_key=api_key,
    )

    collection_name = f"manual_{chunks_payload['document_id'].replace('-', '_')}"

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(VECTORSTORE_DIR),
    )

    try:
        add_documents_in_embedding_batches(vectorstore, documents)
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

def search_similar_chunks(
    collection_name: str,
    query: str,
    k: int = 4,
) -> list[dict[str, Any]]:
    if not query.strip():
        raise ValueError("A pergunta nÃ£o pode estar vazia.")

    if k <= 0:
        raise ValueError("O parÃ¢metro k deve ser maior que zero.")

    settings = get_settings()

    document_id = resolve_document_id_from_collection_name(collection_name)
    api_key = validate_openai_api_key()

    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        openai_api_key=api_key,
    )

    query_embedding = embeddings.embed_query(query)
    query_vector = f"[{','.join(str(value) for value in query_embedding)}]"

    with SessionLocal() as db:
        rows = db.execute(
            text(
                """
                SELECT
                    ec.chunk_index,
                    ec.page,
                    ec.content,
                    ec.embedding_content,
                    ec.title,
                    ec.summary,
                    ec.category,
                    ec.quality_score,
                    ec.is_valid,
                    c.char_count,
                    c.chunk_strategy,
                    e.embedding <=> CAST(:query_embedding AS vector) AS score
                FROM smartdocs.embeddings e
                JOIN smartdocs.enriched_chunks ec
                    ON ec.id = e.enriched_chunk_id
                LEFT JOIN smartdocs.chunks c
                    ON c.id = ec.chunk_id
                WHERE e.document_id = CAST(:document_id AS UUID)
                ORDER BY e.embedding <=> CAST(:query_embedding AS vector)
                LIMIT :k
                """
            ),
            {
                "document_id": document_id,
                "query_embedding": query_vector,
                "k": k,
            },
        ).fetchall()

    return [
        {
            "content": row._mapping["content"],
            "retrieval_content": row._mapping["embedding_content"],
            "metadata": {
                "document_id": document_id,
                "source_file_path": None,
                "chunk_index": row._mapping["chunk_index"],
                "page": row._mapping["page"],
                "char_count": row._mapping["char_count"],
                "chunk_strategy": row._mapping["chunk_strategy"] or "unknown",
                "retrieval_content_type": "enriched",
                "original_content": row._mapping["content"],
                "title": row._mapping["title"] or "",
                "category": row._mapping["category"] or "",
                "summary": row._mapping["summary"] or "",
                "quality_score": row._mapping["quality_score"] or 0,
                "is_valid": row._mapping["is_valid"],
            },
            "score": float(row._mapping["score"]),
        }
        for row in rows
    ]


def resolve_document_id_from_collection_name(collection_name: str) -> str:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                SELECT id
                FROM smartdocs.documents
                WHERE collection_name = :collection_name
                   OR enriched_collection_name = :collection_name
                LIMIT 1
                """
            ),
            {"collection_name": collection_name},
        ).fetchone()

    if row is None:
        raise ValueError("Documento nao encontrado para a collection informada.")

    return str(row._mapping["id"])

def index_enriched_chunks_in_vectorstore(enriched_chunks_file: str) -> dict[str, Any]:
    enriched_payload = load_enriched_chunks_payload(enriched_chunks_file)

    chunks = enriched_payload.get("chunks", [])

    if not chunks:
        raise ValueError("Nenhum chunk enriquecido encontrado para indexaÃ§Ã£o.")

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    settings = get_settings()

    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
    )

    document_id = enriched_payload["document_id"]
    safe_document_id = document_id.replace("-", "_")
    offset = enriched_payload.get("offset")
    limit = enriched_payload.get("limit")
    enrichment_run_id = enriched_payload.get("enrichment_run_id")
    run_token = None
    if enrichment_run_id:
        run_token = enrichment_run_id.replace("-", "")[:8]

    base_collection_name = f"manual_enriched_{safe_document_id}"
    collection_name_prefix = "manual_enriched_"
    document_hash = hashlib.sha256(document_id.encode("utf-8")).hexdigest()[:8]

    if offset is not None and limit is not None:
        collection_suffix = f"_offset_{offset}_limit_{limit}"
        if run_token:
            collection_suffix = f"{collection_suffix}_run_{run_token}"

        max_document_id_length = (
            63 - len(collection_name_prefix) - len(collection_suffix)
        )

        if max_document_id_length <= 0:
            raise ValueError("Nome da collection experimental excede o limite do Chroma.")

        if max_document_id_length <= len(document_hash):
            short_document_id = document_hash[:max_document_id_length]
        else:
            prefix_length = max_document_id_length - len(document_hash) - 1
            short_document_id = f"{safe_document_id[:prefix_length]}_{document_hash}"

        collection_name = (
            f"{collection_name_prefix}{short_document_id}{collection_suffix}"
        )
    elif run_token:
        collection_suffix = f"_run_{run_token}"
        max_document_id_length = (
            63 - len(collection_name_prefix) - len(collection_suffix)
        )

        if max_document_id_length <= 0:
            raise ValueError("Nome da collection experimental excede o limite do Chroma.")

        if max_document_id_length <= len(document_hash):
            short_document_id = document_hash[:max_document_id_length]
        else:
            prefix_length = max_document_id_length - len(document_hash) - 1
            short_document_id = f"{safe_document_id[:prefix_length]}_{document_hash}"

        collection_name = (
            f"{collection_name_prefix}{short_document_id}{collection_suffix}"
        )
    else:
        collection_name = base_collection_name

    documents = []
    total_chunks = len(chunks)
    total_skipped_chunks = 0

    for chunk in chunks:
        enrichment = chunk.get("enrichment", {})
        is_valid = enrichment.get("is_valid", True)
        quality_score = float(enrichment.get("quality_score", 0))

        if is_valid is False or quality_score < 0.5:
            total_skipped_chunks += 1
            continue

        documents.append(
            Document(
                page_content=chunk.get("embedding_content") or chunk["content"],
                metadata={
                    "document_id": document_id,
                    "source_file_path": enriched_payload.get("source_file_path"),
                    "chunk_index": chunk["chunk_index"],
                    "page": chunk["page"],
                    "char_count": chunk["char_count"],
                    "chunk_strategy": chunk.get("chunk_strategy", "unknown"),
                    "retrieval_content_type": "enriched",
                    "original_content": chunk["content"],
                    "title": enrichment.get("title", ""),
                    "category": enrichment.get("category", ""),
                    "summary": enrichment.get("summary", ""),
                    "quality_score": enrichment.get("quality_score", 0),
                    "is_valid": enrichment.get("is_valid", True),
                },
            )
        )

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(VECTORSTORE_DIR),
    )

    try:
        save_embeddings_in_database(
            document_id=document_id,
            documents=documents,
            embeddings=embeddings,
            model=settings.openai_embedding_model,
        )
        add_documents_in_embedding_batches(vectorstore, documents)
    except Exception as error:
        raise ValueError(
            f"Falha ao indexar chunks enriquecidos no vector store: {error}"
        ) from error

    return {
        "document_id": document_id,
        "collection_name": collection_name,
        "total_chunks": total_chunks,
        "total_indexed_documents": len(documents),
        "total_skipped_chunks": total_skipped_chunks,
        "total_documents": len(documents),
        "vectorstore_dir": str(VECTORSTORE_DIR),
    }


def save_embeddings_in_database(
    document_id: str,
    documents: list[Document],
    embeddings: OpenAIEmbeddings,
    model: str,
) -> None:
    if not documents:
        return

    vectors = embeddings.embed_documents(
        [document.page_content for document in documents]
    )

    with SessionLocal() as db:
        db.execute(
            text(
                """
                DELETE FROM smartdocs.embeddings
                WHERE document_id = CAST(:document_id AS UUID)
                """
            ),
            {"document_id": document_id},
        )

        insert_query = text(
            """
            INSERT INTO smartdocs.embeddings (
                id,
                document_id,
                enriched_chunk_id,
                embedding,
                model
            )
            SELECT
                CAST(:id AS UUID),
                CAST(:document_id AS UUID),
                ec.id,
                CAST(:embedding AS vector),
                :model
            FROM smartdocs.enriched_chunks ec
            WHERE ec.document_id = CAST(:document_id AS UUID)
              AND ec.chunk_index = :chunk_index
            """
        )

        for document, vector in zip(documents, vectors):
            deterministic_hash = hashlib.md5(
                (
                    document_id
                    + str(document.metadata.get("chunk_index"))
                    + model
                ).encode("utf-8")
            ).hexdigest()
            deterministic_id = (
                f"{deterministic_hash[:8]}-"
                f"{deterministic_hash[8:12]}-"
                f"{deterministic_hash[12:16]}-"
                f"{deterministic_hash[16:20]}-"
                f"{deterministic_hash[20:]}"
            )

            db.execute(
                insert_query,
                {
                    "id": deterministic_id,
                    "document_id": document_id,
                    "chunk_index": document.metadata["chunk_index"],
                    "embedding": f"[{','.join(str(value) for value in vector)}]",
                    "model": model,
                },
            )

        db.commit()


def delete_vectorstore_collection(collection_name: str) -> dict[str, Any]:
    if not collection_name:
        raise ValueError("Nome da collection nÃ£o informado.")

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(VECTORSTORE_DIR))

    try:
        client.delete_collection(name=collection_name)

        return {
            "collection_name": collection_name,
            "deleted": True,
            "message": "Collection removida com sucesso.",
        }

    except Exception as error:
        return {
            "collection_name": collection_name,
            "deleted": False,
            "message": str(error),
        }

