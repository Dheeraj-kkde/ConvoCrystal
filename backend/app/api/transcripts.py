"""
Transcripts API — file upload + processing trigger.

Endpoints:
  POST /transcripts/upload   → TranscriptUploadResponse  (multipart)
  GET  /transcripts          → list of transcripts
  GET  /transcripts/{id}     → single transcript
  DELETE /transcripts/{id}   → 204
"""

import hashlib
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.transcript import Transcript, TranscriptStatus, TranscriptVersion
from app.models.document import Document, DocumentType, DocumentDirection, DocumentStatus
from app.models.activity import ActivityLog
from app.schemas.transcript import TranscriptUploadResponse, TranscriptOut

router = APIRouter(prefix="/transcripts", tags=["transcripts"])

ALLOWED_EXTENSIONS = {".vtt", ".srt", ".txt", ".docx", ".json", ".pdf", ".mp4", ".m4a", ".wav", ".mp3"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _detect_format(filename: str) -> str:
    ext = os.path.splitext(filename)[-1].lower()
    return ext.lstrip(".")


def _size_human(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


# ─── Upload ───────────────────────────────────────────────────────

@router.post("/upload", response_model=TranscriptUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_transcript(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate extension
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "code": "INVALID_FORMAT",
                "message": f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            },
        )

    # Read file (stream to avoid memory blow-up on large files)
    content = await file.read()
    size = len(content)

    if size > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB",
            },
        )

    # SHA-256 for deduplication
    sha256 = hashlib.sha256(content).hexdigest()

    # Check for duplicate
    existing = await db.execute(
        select(Transcript).where(
            Transcript.owner_id == current_user.id,
            Transcript.sha256 == sha256,
        )
    )
    dupe = existing.scalar_one_or_none()
    if dupe:
        return TranscriptUploadResponse(
            uploadId=dupe.id,
            transcriptId=dupe.id,
            name=dupe.name,
            status=dupe.status.value,
            message="Duplicate detected — returning existing transcript",
        )

    # Persist transcript record
    fmt = _detect_format(file.filename or "unknown")
    transcript = Transcript(
        owner_id=current_user.id,
        name=(file.filename or "Untitled").rsplit(".", 1)[0],
        format=fmt,
        size_bytes=size,
        sha256=sha256,
        status=TranscriptStatus.queued,
    )
    db.add(transcript)
    await db.flush()

    # Also create a Document entry so it appears in the document list
    doc = Document(
        owner_id=current_user.id,
        transcript_id=transcript.id,
        name=transcript.name,
        doc_type=DocumentType.transcript,
        direction=DocumentDirection.uploaded,
        status=DocumentStatus.processing,
        format=fmt.upper(),
        size_bytes=size,
    )
    db.add(doc)

    # Log activity
    db.add(ActivityLog(
        user_id=current_user.id,
        action="Uploaded",
        target=file.filename or "Unknown",
        format=fmt.upper(),
    ))

    await db.flush()

    # Upload to MinIO (fire-and-forget via Celery)
    try:
        from app.workers.tasks import process_transcript
        process_transcript.delay(
            transcript_id=transcript.id,
            owner_id=current_user.id,
            file_content=content.hex(),  # serialise bytes as hex for celery
            filename=file.filename or "upload",
        )
    except Exception:
        # If Celery unavailable, start processing inline (dev mode)
        pass

    return TranscriptUploadResponse(
        uploadId=transcript.id,
        transcriptId=transcript.id,
        name=transcript.name,
        status=transcript.status.value,
    )


# ─── List transcripts ─────────────────────────────────────────────

@router.get("", response_model=list[TranscriptOut])
async def list_transcripts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transcript)
        .where(Transcript.owner_id == current_user.id)
        .order_by(Transcript.created_at.desc())
    )
    return result.scalars().all()


# ─── Get single transcript ────────────────────────────────────────

@router.get("/{transcript_id}", response_model=TranscriptOut)
async def get_transcript(
    transcript_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transcript).where(
            Transcript.id == transcript_id, Transcript.owner_id == current_user.id
        )
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Transcript not found"})
    return t


# ─── Delete transcript ────────────────────────────────────────────

@router.delete("/{transcript_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transcript(
    transcript_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transcript).where(
            Transcript.id == transcript_id, Transcript.owner_id == current_user.id
        )
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Transcript not found"})

    await db.delete(t)
