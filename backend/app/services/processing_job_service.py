import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4


PROCESSING_JOBS_DIR = Path("app/storage/processing_jobs")

STATUS_PENDING = "pending"
STATUS_PROCESSING = "processing"
STATUS_COMPLETED = "completed"
STATUS_FAILED = "failed"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def _job_path(job_id: str) -> Path:
    return PROCESSING_JOBS_DIR / f"{job_id}.json"


def _save_processing_job(job: dict[str, Any]) -> None:
    PROCESSING_JOBS_DIR.mkdir(parents=True, exist_ok=True)
    with _job_path(job["job_id"]).open("w", encoding="utf-8") as file:
        json.dump(job, file, ensure_ascii=False, indent=2)


def create_processing_job(job_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    PROCESSING_JOBS_DIR.mkdir(parents=True, exist_ok=True)

    job_id = str(uuid4())
    created_at = now_iso()
    job = {
        "job_id": job_id,
        "job_type": job_type,
        "status": STATUS_PENDING,
        "progress": 0,
        "current_step": "Job criado",
        "payload": payload,
        "result": None,
        "error": None,
        "created_at": created_at,
        "updated_at": created_at,
    }

    _save_processing_job(job)
    return job


def get_processing_job(job_id: str) -> dict[str, Any]:
    path = _job_path(job_id)
    if not path.exists():
        raise ValueError("Job não encontrado.")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def update_processing_job(job_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    job = get_processing_job(job_id)
    job.update(updates)
    job["updated_at"] = now_iso()

    _save_processing_job(job)
    return job


def list_processing_jobs() -> list[dict[str, Any]]:
    if not PROCESSING_JOBS_DIR.exists():
        return []

    jobs = []
    for path in PROCESSING_JOBS_DIR.glob("*.json"):
        with path.open("r", encoding="utf-8") as file:
            jobs.append(json.load(file))

    return sorted(jobs, key=lambda job: job["created_at"], reverse=True)
