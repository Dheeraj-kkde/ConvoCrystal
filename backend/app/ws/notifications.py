"""
WebSocket notifications handler — /ws/notifications

Server → Client:
  {
    "type": "notification",
    "iconType": "check-circle",
    "color": "#10B981",
    "title": "...",
    "body": "...",
    "unread": true,
    "toastVariant": "success"
  }

Uses Redis pub/sub channel `notifications:{user_id}` for fan-out.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.dependencies import get_current_user_ws

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/notifications")
async def notifications_websocket(
    websocket: WebSocket,
    token: str | None = Query(default=None),
):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        user = await get_current_user_ws(token, db) if token else None
        if not user:
            await websocket.send_json({"type": "error", "message": "Unauthorized"})
            await websocket.close(code=4001)
            return
        user_id = user.id

    try:
        try:
            import redis.asyncio as aioredis
            from app.core.config import settings

            redis = aioredis.from_url(settings.REDIS_URL)
            channel = f"notifications:{user_id}"
            pubsub = redis.pubsub()
            await pubsub.subscribe(channel)

            # Keep connection alive and forward messages
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    data = json.loads(message["data"])
                    await websocket.send_json(data)
                except Exception:
                    pass

        except Exception:
            # Fallback: keep alive with ping-pong
            while True:
                await asyncio.sleep(30)
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break

    except WebSocketDisconnect:
        logger.info(f"Notifications WS disconnected: user={user_id}")
    except Exception as e:
        logger.error(f"Notifications WS error: {e}")


async def push_notification(
    user_id: str,
    icon_type: str,
    color: str,
    title: str,
    body: str,
    toast_variant: str = "info",
):
    """Push a notification to a specific user via Redis pub/sub."""
    try:
        import redis.asyncio as aioredis
        from app.core.config import settings

        redis = aioredis.from_url(settings.REDIS_URL)
        payload = json.dumps({
            "type": "notification",
            "iconType": icon_type,
            "color": color,
            "title": title,
            "body": body,
            "unread": True,
            "toastVariant": toast_variant,
        })
        await redis.publish(f"notifications:{user_id}", payload)
        await redis.aclose()

        # Also persist to DB
        from app.models.notification import Notification
        async with AsyncSessionLocal() as db:
            n = Notification(
                user_id=user_id,
                icon_type=icon_type,
                color=color,
                title=title,
                body=body,
                toast_variant=toast_variant,
                unread=True,
            )
            db.add(n)
            await db.commit()

    except Exception as e:
        logger.warning(f"Failed to push notification: {e}")
