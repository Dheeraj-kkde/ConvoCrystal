"""
Celery async tasks for background transcript processing.

Pipeline stages:
  queued → parsing → extracting → analyzing → scoring → complete
"""

import asyncio
import logging
from datetime import datetime, timezone

from app.workers.celery import celery_app

logger = logging.getLogger(__name__)

STAGES = [
    ("queued", 0),
    ("parsing", 1),
    ("extracting", 2),
    ("analyzing", 3),
    ("scoring", 4),
]


def run_async(coro):
    """Helper: run an async coroutine in the Celery (sync) task context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="process_transcript", max_retries=3)
def process_transcript(
    self,
    transcript_id: str,
    owner_id: str,
    file_content: str,    # hex-encoded bytes
    filename: str,
):
    """
    Main transcript processing task.

    1. Uploads raw file to MinIO.
    2. Parses the transcript format (VTT/SRT/TXT/DOCX).
    3. Runs AI analysis pipeline.
    4. Updates transcript + document records.
    5. Generates embeddings for semantic search.
    6. Sends progress via Redis pub/sub.
    7. Fires completion notification.
    """
    run_async(_process_transcript_async(
        self, transcript_id, owner_id, file_content, filename
    ))


async def _process_transcript_async(
    task,
    transcript_id: str,
    owner_id: str,
    file_content_hex: str,
    filename: str,
):
    from app.core.database import AsyncSessionLocal
    from app.models.transcript import Transcript, TranscriptStatus
    from app.models.document import Document, DocumentStatus
    from app.ws.upload import publish_stage, publish_complete, publish_error
    from app.ws.notifications import push_notification
    from app.services.ai.pipeline import process_transcript_pipeline
    from app.services import storage as storage_svc

    file_bytes = bytes.fromhex(file_content_hex)

    async def _stage(name: str, index: int):
        """Update DB + publish to WS."""
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(select(Transcript).where(Transcript.id == transcript_id))
            t = result.scalar_one_or_none()
            if t:
                t.status = TranscriptStatus[name] if name in TranscriptStatus.__members__ else t.status
                await db.commit()
        await publish_stage(transcript_id, index, name)

    try:
        await _stage("queued", 0)

        # 1. Upload to MinIO
        object_key = f"transcripts/{owner_id}/{transcript_id}/{filename}"
        try:
            await storage_svc.ensure_bucket()
            await storage_svc.upload_file(object_key, file_bytes)
        except Exception as e:
            logger.warning(f"MinIO upload failed: {e}. Continuing without file storage.")

        await _stage("parsing", 1)

        # 2. Parse transcript text
        raw_text = await _parse_transcript(file_bytes, filename)

        await _stage("extracting", 2)
        await _stage("analyzing", 3)

        # 3. Run AI analysis
        async def on_pipeline_stage(stage_name: str, stage_index: int):
            await publish_stage(transcript_id, stage_index, stage_name)

        analysis = await process_transcript_pipeline(
            raw_text=raw_text,
            on_stage=on_pipeline_stage,
        )

        await _stage("scoring", 4)

        # 4. Generate embedding
        embedding = None
        try:
            from app.services.search import embed_query
            embedding = await embed_query(raw_text[:2000])
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")

        # 5. Update transcript record
        overall_confidence = analysis.get("overall_confidence", 88)
        speakers_list = analysis.get("speakers", [])
        speaker_count = len(speakers_list)

        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(select(Transcript).where(Transcript.id == transcript_id))
            t = result.scalar_one_or_none()
            if t:
                t.status = TranscriptStatus.processed
                t.raw_text = raw_text
                t.analysis = analysis
                t.confidence = overall_confidence
                t.speakers = speaker_count
                t.storage_key = object_key
                t.processed_at = datetime.now(timezone.utc)
                if embedding:
                    t.embedding = embedding  # pgvector column
                await db.commit()

            # Update linked document
            doc_result = await db.execute(
                select(Document).where(Document.transcript_id == transcript_id)
            )
            doc = doc_result.scalar_one_or_none()
            if doc:
                doc.status = DocumentStatus.processed
                doc.confidence = int(overall_confidence)
                doc.speakers = speaker_count
                await db.commit()

        # 6. Publish complete
        await publish_complete(transcript_id)

        # 7. Send notification
        transcript_name = filename.rsplit(".", 1)[0]
        await push_notification(
            user_id=owner_id,
            icon_type="check-circle",
            color="#10B981",
            title="Transcript ready",
            body=f"{transcript_name} finished processing with {int(overall_confidence)}% confidence.",
            toast_variant="success",
        )

    except Exception as e:
        logger.error(f"Transcript processing failed for {transcript_id}: {e}")

        # Mark as failed
        try:
            async with AsyncSessionLocal() as db:
                from sqlalchemy import select
                result = await db.execute(select(Transcript).where(Transcript.id == transcript_id))
                t = result.scalar_one_or_none()
                if t:
                    t.status = TranscriptStatus.failed
                    t.error_message = str(e)
                    await db.commit()

                doc_result = await db.execute(
                    select(Document).where(Document.transcript_id == transcript_id)
                )
                doc = doc_result.scalar_one_or_none()
                if doc:
                    doc.status = DocumentStatus.failed
                    await db.commit()
        except Exception:
            pass

        await publish_error(transcript_id, str(e))
        await push_notification(
            user_id=owner_id,
            icon_type="x-circle",
            color="#F43F5E",
            title="Processing error",
            body=f"Failed to process {filename}. Please try again.",
            toast_variant="error",
        )

        raise task.retry(exc=e, countdown=30)


async def _parse_transcript(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from various transcript formats."""
    ext = filename.rsplit(".", 1)[-1].lower()

    try:
        if ext == "vtt":
            return _parse_vtt(file_bytes.decode("utf-8", errors="replace"))
        elif ext == "srt":
            return _parse_srt(file_bytes.decode("utf-8", errors="replace"))
        elif ext in ("txt", "json"):
            return file_bytes.decode("utf-8", errors="replace")
        elif ext == "docx":
            return _parse_docx(file_bytes)
        elif ext == "pdf":
            return _parse_pdf(file_bytes)
        else:
            return file_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        logger.warning(f"Parse error for {ext}: {e}")
        return file_bytes.decode("utf-8", errors="replace")


def _parse_vtt(text: str) -> str:
    """Strip VTT timestamps and return dialogue text."""
    import re
    lines = text.splitlines()
    output = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith("WEBVTT") or "-->" in line or line.isdigit():
            continue
        output.append(line)
    return "\n".join(output)


def _parse_srt(text: str) -> str:
    """Strip SRT timestamps and return dialogue text."""
    import re
    # Remove index lines and timestamps
    cleaned = re.sub(r"^\d+$", "", text, flags=re.MULTILINE)
    cleaned = re.sub(r"\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}", "", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _parse_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        from io import BytesIO
        from docx import Document as DocxDocument
        doc = DocxDocument(BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except ImportError:
        logger.warning("python-docx not installed, returning raw bytes")
        return file_bytes.decode("utf-8", errors="replace")


def _parse_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pdfminer."""
    try:
        from io import BytesIO
        from pdfminer.high_level import extract_text as pdf_extract
        return pdf_extract(BytesIO(file_bytes))
    except ImportError:
        logger.warning("pdfminer.six not installed, returning empty string")
        return ""
