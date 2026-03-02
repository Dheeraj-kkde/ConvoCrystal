from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class ChatMessageOut(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    confidence: dict | None = None
    citations: list | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionOut(BaseModel):
    id: str
    title: str
    is_starred: bool
    avg_confidence: float | None = None
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
