import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from app.api.admin_auth import require_admin_user
from app.services.document_registry_service import (
    delete_registered_document,
    find_registered_document_by_id,
    list_registered_documents,
)
from app.services.processing_job_service import create_processing_job
from app.services.queue_service import enqueue_smart_ingest_job
from app.services.theme_service import find_theme_by_id
from app.services.uploaded_file_service import save_uploaded_file_to_db
from app.services.usage_log_service import (
    EVENT_DOCUMENT_DELETED,
    EVENT_SMART_INGEST_STARTED,
    create_usage_log,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


def remove_file_if_exists(file_path: str | None) -> bool:
    if not file_path:
        return False

    path = Path(file_path)

    if not path.exists():
        return False

    if not path.is_file():
        return False

    path.unlink()

    return True


@router.get("")
def list_documents():
    documents = list_registered_documents()

    return {
        "total": len(documents),
        "documents": documents,
    }


@router.delete("/{document_id}")
def delete_document(
    request: Request,
    document_id: str,
    admin_user: dict = Depends(require_admin_user),
):
    try:
        document = find_registered_document_by_id(document_id)

        if document is None:
            raise ValueError("Documento não encontrado.")

        removed_document = delete_registered_document(document_id)

        deleted_files = []

        for field in ["file_path", "chunks_file", "enriched_chunks_file"]:
            file_path = removed_document.get(field)

            if remove_file_if_exists(file_path):
                deleted_files.append(
                    {
                        "field": field,
                        "path": file_path,
                    }
                )

        try:
            create_usage_log(
                event_type=EVENT_DOCUMENT_DELETED,
                ip_address=request.client.host if request.client else None,
                user_id=admin_user["id"],
                document_id=document_id,
                metadata={
                    "document_id": document_id,
                    "original_filename": removed_document.get("original_filename"),
                    "deleted_files": deleted_files,
                },
            )
        except Exception:
            logger.exception("Falha ao registrar usage_log de document deleted")

        return {
            "message": "Documento apagado com sucesso.",
            "document_id": document_id,
            "deleted_files": deleted_files,
            "removed_document": removed_document,
        }

    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        logger.exception("Erro inesperado ao apagar documento")
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado ao apagar documento: {error}",
        )


@router.post("/smart-ingest/start")
def start_smart_ingest(
    request: Request,
    file: UploadFile = File(...),
    theme_id: str = Form("generic_pdf"),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
    batch_size: int = Form(10),
    admin_user: dict = Depends(require_admin_user),
):
    try:
        theme = find_theme_by_id(theme_id)

        if theme is None:
            raise ValueError("Tema informado não encontrado.")

        ip_address = request.client.host if request.client else "unknown"
        original_filename = file.filename or "documento.pdf"
        file_extension = Path(original_filename).suffix.lower() or ".pdf"
        stored_filename = f"{uuid4()}{file_extension}"
        saved_file = save_uploaded_file_to_db(file, stored_filename)

        job = create_processing_job(
            job_type="smart_ingest",
            payload={
                "uploaded_file_id": saved_file["uploaded_file_id"],
                "original_filename": saved_file["original_filename"],
                "stored_filename": saved_file["stored_filename"],
                "content_type": saved_file["content_type"],
                "file_size": saved_file["file_size"],
                "file_path": saved_file["file_path"],
                "theme_id": theme["theme_id"],
                "theme_name": theme["name"],
                "chunk_size": chunk_size,
                "chunk_overlap": chunk_overlap,
                "batch_size": batch_size,
                "admin_user_id": admin_user["id"],
                "admin_email": admin_user["email"],
                "ip_address": ip_address,
            },
        )

        queue_job = enqueue_smart_ingest_job(
            job_id=job["job_id"],
            saved_file=saved_file,
            theme_id=theme_id,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            batch_size=batch_size,
        )

        try:
            create_usage_log(
                event_type=EVENT_SMART_INGEST_STARTED,
                ip_address=ip_address,
                user_id=admin_user["id"],
                metadata={
                    "job_id": job["job_id"],
                    "queue_job_id": queue_job.id,
                    "uploaded_file_id": saved_file["uploaded_file_id"],
                    "original_filename": saved_file["original_filename"],
                    "stored_filename": saved_file["stored_filename"],
                    "content_type": saved_file["content_type"],
                    "file_size": saved_file["file_size"],
                    "theme_id": theme["theme_id"],
                    "theme_name": theme["name"],
                    "chunk_size": chunk_size,
                    "chunk_overlap": chunk_overlap,
                    "batch_size": batch_size,
                    "admin_email": admin_user["email"],
                },
            )
        except Exception:
            logger.exception("Falha ao registrar usage_log de smart ingest started")

        return {
            "message": "Processamento inteligente iniciado.",
            "job": job,
            "queue_job_id": queue_job.id,
        }

    except ValueError as error:
        logger.warning("Falha de validação ao iniciar smart ingest: %s", error)
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        logger.exception("Erro inesperado ao iniciar smart ingest")
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado ao iniciar smart ingest: {error}",
        )
