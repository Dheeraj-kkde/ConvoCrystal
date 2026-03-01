"""
WebSocket upload progress handler — /ws/upload/{uploadId}

Server → Client messages:
  { "type": "stage",    "index": 0-4, "name": "queued"|"parsing"|"extracting"|"analyzing"|"scoring" }
  { "type": "complete" }
  { "type": "error",    "message": "..." }

The Celery task publishes stage updates via Redis pub/sub; this WS handler
subscribes and forwards them to the browser.
"""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.dependencies import get_current_user_ws
from app.models.transcript import Transcript, TranscriptStatus

logger = logging.getLogger(__name__)
router = APIRouter()

STAGES = ["queued", "parsing", "extracting", "analyzing", "scoring"]


@router.websocket("/ws/upload/{upload_id}")
async def upload_websocket(
    websocket: WebSocket,
    upload_id: str,
    token: str | None = Query(default=None),
):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        # Auth
        user = await get_current_user_ws(token, db) if token else None
        if not user:
            await websocket.send_json({"type": "error", "message": "Unauthorized"})
            await websocket.close(code=4001)
            return

        # Verify the transcript belongs to this user
        result = await db.execute(
            select(Transcript).where(Transcript.id == upload_id, Transcript.owner_id == user.id)
        )
        transcript = result.scalar_one_or_none()
        if not transcript:
            await websocket.send_json({"type": "error", "message": "Upload not found"})
            await websocket.close(code=4004)
            return

    try:
        # Try to subscribe via Redis pub/sub
        try:
            import redis.asyncio as aioredis
            from app.core.config import settings

            redis = aioredis.from_url(settings.REDIS_URL)
            channel = f"upload:{upload_id}"
            pubsub = redis.pubsub()
            await pubsub.subscribe(channel)

            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                data = json.loads(message["data"])
                await websocket.send_json(data)
                if data.get("type") in ("complete", "error"):
                    break

            await pubsub.unsubscribe(channel)
            await redis.aclose()

        except Exception:
            # Fallback: poll transcript status from DB
            await _poll_transcript_status(websocket, upload_id)

    except WebSocketDisconnect:
        logger.info(f"Upload WS disconnected: upload_id={upload_id}")
    except Exception as e:
        logger.error(f"Upload WS error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


async def _poll_transcript_status(websocket: WebSocket, upload_id: str):
    """Poll transcript status every second and forward stage updates."""
    last_status = None
    sent_stages: set[str] = set()

    for _ in range(120):  # max 2 minutes
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Transcript).where(Transcript.id == upload_id)
                )
                t = result.scalar_one_or_none()
                if not t:
                    break

                current_status = t.status.value
                if current_status != last_status:
                    last_status = current_status

                    if current_status in STAGES and current_status not in sent_stages:
                        idx = STAGES.index(current_status)
                        await websocket.send_json({
                            "type": "stage",
                            "index": idx,
                            "name": current_status,
                        })
                        sent_stages.add(current_status)

                    elif current_status == TranscriptStatus.processed.value:
                        # Send remaining unsent stages
                        for idx, stage in enumerate(STAGES):
                            if stage not in sent_stages:
                                await websocket.send_json({"type": "stage", "index": idx, "name": stage})
                        await websocket.send_json({"type": "complete"})
                        return

                    elif current_status == TranscriptStatus.failed.value:
                        await websocket.send_json({"type": "error", "message": "Processing failed"})
                        return

        except Exception as e:
            logger.warning(f"Poll error: {e}")

        await asyncio.sleep(1)


async def publish_stage(upload_id: str, stage_index: int, stage_name: str):
    """Called by Celery worker to publish stage progress."""
    try:
        import redis.asyncio as aioredis
        from app.core.config import settings

        redis = aioredis.from_url(settings.REDIS_URL)
        await redis.publish(
            f"upload:{upload_id}",
            json.dumps({"type": "stage", "index": stage_index, "name": stage_name}),
        )
        await redis.aclose()
    except Exception as e:
        logger.warning(f"Failed to publish stage: {e}")


async def publish_complete(upload_id: str):
    """Called by Celery worker on completion."""
    try:
        import redis.asyncio as aioredis
        from app.core.config import settings

        redis = aioredis.from_url(settings.REDIS_URL)
        await redis.publish(f"upload:{upload_id}", json.dumps({"type": "complete"}))
        await redis.aclose()
    except Exception as e:
        logger.warning(f"Failed to publish complete: {e}")


async def publish_error(upload_id: str, message: str):
    """Called by Celery worker on error."""
    try:
        import redis.asyncio as aioredis
        from app.core.config import settings

        redis = aioredis.from_url(settings.REDIS_URL)
        await redis.publish(f"upload:{upload_id}", json.dumps({"type": "error", "message": message}))
        await redis.aclose()
    except Exception as e:
        logger.warning(f"Failed to publish error: {e}")
