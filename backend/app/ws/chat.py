"""
WebSocket chat handler — /ws/chat/{sessionId}

Wire protocol (JSON):
  Client → Server:
    { "type": "chat", "prompt": "...", "sessionId": "..." }
    { "type": "interrupt" }

  Server → Client:
    { "type": "stage",  "stage": "extracting"|"analyzing"|"retrieving"|"generating" }
    { "type": "token",  "delta": "..." }
    { "type": "done",   "confidence": {...}, "citations": [...] }
    { "type": "error",  "message": "..." }
"""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.dependencies import get_current_user_ws
from app.models.chat import ChatSession, ChatMessage, MessageRole
from app.services.ai.llm import stream_chat_response

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/chat/{session_id}")
async def chat_websocket(
    websocket: WebSocket,
    session_id: str,
    token: str | None = Query(default=None),
):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        # Authenticate via token query param
        user = await get_current_user_ws(token, db) if token else None
        if not user:
            await websocket.send_json({"type": "error", "message": "Unauthorized"})
            await websocket.close(code=4001)
            return

        # Ensure chat session exists
        result = await db.execute(
            select(ChatSession).where(ChatSession.id == session_id, ChatSession.owner_id == user.id)
        )
        session = result.scalar_one_or_none()

        if not session:
            # Create on-the-fly if not found
            session = ChatSession(
                id=session_id,
                owner_id=user.id,
                title="Chat session",
            )
            db.add(session)
            await db.commit()

        # Load transcript for context
        transcript_text = ""
        if session.transcript_id:
            from app.models.transcript import Transcript
            t_result = await db.execute(
                select(Transcript).where(Transcript.id == session.transcript_id)
            )
            transcript = t_result.scalar_one_or_none()
            if transcript:
                transcript_text = transcript.raw_text or ""

        interrupt_event = asyncio.Event()

        try:
            while True:
                raw = await websocket.receive_text()
                msg = json.loads(raw)

                if msg.get("type") == "interrupt":
                    interrupt_event.set()
                    continue

                if msg.get("type") != "chat":
                    continue

                prompt = msg.get("prompt", "").strip()
                if not prompt:
                    continue

                interrupt_event.clear()

                # Persist user message
                user_msg = ChatMessage(
                    session_id=session.id,
                    role=MessageRole.user,
                    content=prompt,
                )
                db.add(user_msg)
                await db.commit()

                # Stream AI response
                full_response = ""
                final_confidence = None
                final_citations = None

                try:
                    async for event in stream_chat_response(
                        prompt=prompt,
                        transcript_context=transcript_text,
                        session_id=session.id,
                        interrupt_event=interrupt_event,
                    ):
                        if event["type"] == "stage":
                            await websocket.send_json({"type": "stage", "stage": event["stage"]})

                        elif event["type"] == "token":
                            full_response += event["delta"]
                            await websocket.send_json({"type": "token", "delta": event["delta"]})

                        elif event["type"] == "done":
                            final_confidence = event.get("confidence")
                            final_citations = event.get("citations")
                            await websocket.send_json({
                                "type": "done",
                                "confidence": final_confidence,
                                "citations": final_citations,
                            })
                            break

                        elif event["type"] == "error":
                            await websocket.send_json({"type": "error", "message": event["message"]})
                            break

                except asyncio.CancelledError:
                    pass

                # Persist assistant message
                if full_response:
                    assistant_msg = ChatMessage(
                        session_id=session.id,
                        role=MessageRole.assistant,
                        content=full_response,
                        confidence=final_confidence,
                        citations=final_citations,
                    )
                    db.add(assistant_msg)

                    # Update session confidence
                    if final_confidence:
                        session.avg_confidence = final_confidence.get("overall")

                    await db.commit()

        except WebSocketDisconnect:
            logger.info(f"Chat WS disconnected: session={session_id}")
        except Exception as e:
            logger.error(f"Chat WS error: {e}")
            try:
                await websocket.send_json({"type": "error", "message": str(e)})
            except Exception:
                pass
