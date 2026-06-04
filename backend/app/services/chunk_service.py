from pathlib import Path
from typing import Any
from uuid import uuid4

from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import JSONB

from app.database.database import SessionLocal

DB_CHUNKS_URI_PREFIX = "db://chunks/"


def split_text_into_chunks(
    pages: list[dict[str, Any]],
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[dict[str, Any]]:
    if chunk_size <= 0:
        raise ValueError("chunk_size deve ser maior que zero.")

    if chunk_overlap < 0:
        raise ValueError("chunk_overlap não pode ser negativo.")

    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap deve ser menor que chunk_size.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=[
            "\n\n",
            "\n",
            ". ",
            "; ",
            ", ",
            " ",
            "",
        ],
    )

    chunks = []
    chunk_index = 1

    for page in pages:
        page_number = page["page"]
        text = page["text"].strip()

        if not text:
            continue

        page_chunks = splitter.split_text(text)

        for page_chunk in page_chunks:
            chunk_text = page_chunk.strip()

            if not chunk_text:
                continue

            chunks.append(
                {
                    "chunk_index": chunk_index,
                    "page": page_number,
                    "content": chunk_text,
                    "char_count": len(chunk_text),
                    "chunk_strategy": "recursive_character",
                }
            )

            chunk_index += 1

    return chunks


def save_chunks_to_json(
    chunks: list[dict[str, Any]],
    source_file_path: str,
) -> dict[str, Any]:
    if not chunks:
        raise ValueError("Nenhum chunk foi gerado para salvar.")

    document_id = str(uuid4())
    chunks_reference = f"{DB_CHUNKS_URI_PREFIX}{document_id}"
    source_path = Path(source_file_path)

    with SessionLocal() as db:
        db.execute(
            text(
                """
                INSERT INTO smartdocs.documents (
                    id,
                    original_filename,
                    stored_filename,
                    file_path,
                    total_chunks,
                    chunks_file,
                    status
                )
                VALUES (
                    CAST(:document_id AS UUID),
                    :original_filename,
                    :stored_filename,
                    :file_path,
                    :total_chunks,
                    :chunks_file,
                    :status
                )
                ON CONFLICT (id) DO UPDATE SET
                    file_path = EXCLUDED.file_path,
                    total_chunks = EXCLUDED.total_chunks,
                    chunks_file = EXCLUDED.chunks_file,
                    updated_at = NOW()
                """
            ),
            {
                "document_id": document_id,
                "original_filename": source_path.name,
                "stored_filename": source_path.name,
                "file_path": source_file_path,
                "total_chunks": len(chunks),
                "chunks_file": chunks_reference,
                "status": "processing",
            },
        )

        insert_chunk_query = text(
            """
            INSERT INTO smartdocs.chunks (
                id,
                document_id,
                chunk_index,
                page,
                content,
                char_count,
                chunk_strategy,
                metadata
            )
            VALUES (
                CAST(:id AS UUID),
                CAST(:document_id AS UUID),
                :chunk_index,
                :page,
                :content,
                :char_count,
                :chunk_strategy,
                :metadata
            )
            ON CONFLICT (document_id, chunk_index) DO UPDATE SET
                page = EXCLUDED.page,
                content = EXCLUDED.content,
                char_count = EXCLUDED.char_count,
                chunk_strategy = EXCLUDED.chunk_strategy,
                metadata = EXCLUDED.metadata
            """
        ).bindparams(bindparam("metadata", type_=JSONB))

        for chunk in chunks:
            db.execute(
                insert_chunk_query,
                {
                    "id": str(uuid4()),
                    "document_id": document_id,
                    "chunk_index": chunk["chunk_index"],
                    "page": chunk.get("page"),
                    "content": chunk["content"],
                    "char_count": chunk.get("char_count"),
                    "chunk_strategy": chunk.get(
                        "chunk_strategy",
                        "recursive_character",
                    ),
                    "metadata": chunk.get("metadata", {}),
                },
            )

        db.commit()

    return {
        "document_id": document_id,
        "chunks_file": chunks_reference,
        "total_chunks": len(chunks),
    }
