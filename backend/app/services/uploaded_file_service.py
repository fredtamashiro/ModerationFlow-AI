import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import text

from app.config import get_settings
from app.database.database import SessionLocal

DB_UPLOADED_FILES_URI_PREFIX = "db://uploaded_files/"


def _validate_pdf_upload(file: UploadFile) -> tuple[str, bytes]:
    if not file.filename:
        raise ValueError("Arquivo sem nome.")

    file_extension = Path(file.filename).suffix.lower()

    if file_extension != ".pdf":
        raise ValueError("Apenas arquivos PDF sao permitidos.")

    settings = get_settings()
    max_file_size_bytes = settings.max_upload_file_size_mb * 1024 * 1024

    file.file.seek(0)
    file_data = file.file.read(max_file_size_bytes + 1)

    if len(file_data) > max_file_size_bytes:
        raise ValueError(
            "Arquivo PDF muito grande. "
            f"O limite e de {settings.max_upload_file_size_mb} MB."
        )

    return file_extension, file_data


def save_uploaded_file_to_db(file: UploadFile, stored_filename: str) -> dict:
    file_extension, file_data = _validate_pdf_upload(file)
    uploaded_file_id = str(uuid4())

    if not stored_filename.endswith(file_extension):
        stored_filename = f"{stored_filename}{file_extension}"

    with SessionLocal() as db:
        db.execute(
            text(
                """
                INSERT INTO smartdocs.uploaded_files (
                    id,
                    original_filename,
                    stored_filename,
                    content_type,
                    file_size,
                    file_data
                )
                VALUES (
                    CAST(:id AS UUID),
                    :original_filename,
                    :stored_filename,
                    :content_type,
                    :file_size,
                    :file_data
                )
                """
            ),
            {
                "id": uploaded_file_id,
                "original_filename": file.filename,
                "stored_filename": stored_filename,
                "content_type": file.content_type,
                "file_size": len(file_data),
                "file_data": file_data,
            },
        )
        db.commit()

    return {
        "uploaded_file_id": uploaded_file_id,
        "original_filename": file.filename,
        "stored_filename": stored_filename,
        "content_type": file.content_type,
        "file_size": len(file_data),
        "file_path": f"{DB_UPLOADED_FILES_URI_PREFIX}{uploaded_file_id}",
    }


def get_uploaded_file_from_db(uploaded_file_id: str) -> dict | None:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                SELECT
                    id,
                    original_filename,
                    stored_filename,
                    content_type,
                    file_size,
                    file_data,
                    created_at
                FROM smartdocs.uploaded_files
                WHERE id = CAST(:uploaded_file_id AS UUID)
                """
            ),
            {"uploaded_file_id": uploaded_file_id},
        ).fetchone()

    if row is None:
        return None

    mapping = row._mapping
    file_data = mapping["file_data"]

    if isinstance(file_data, memoryview):
        file_data = file_data.tobytes()

    return {
        "uploaded_file_id": str(mapping["id"]),
        "original_filename": mapping["original_filename"],
        "stored_filename": mapping["stored_filename"],
        "content_type": mapping["content_type"],
        "file_size": mapping["file_size"] or 0,
        "file_data": file_data,
        "file_path": f"{DB_UPLOADED_FILES_URI_PREFIX}{mapping['id']}",
        "created_at": mapping["created_at"].isoformat() if mapping["created_at"] else None,
    }


def delete_uploaded_file_from_db(uploaded_file_id: str) -> bool:
    with SessionLocal() as db:
        row = db.execute(
            text(
                """
                DELETE FROM smartdocs.uploaded_files
                WHERE id = CAST(:uploaded_file_id AS UUID)
                RETURNING id
                """
            ),
            {"uploaded_file_id": uploaded_file_id},
        ).fetchone()
        db.commit()

    return row is not None


def write_uploaded_file_to_temp(uploaded_file: dict) -> str:
    stored_filename = uploaded_file.get("stored_filename") or "uploaded.pdf"
    suffix = Path(stored_filename).suffix or ".pdf"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(uploaded_file["file_data"])
        return temp_file.name
