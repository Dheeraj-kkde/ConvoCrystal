from datetime import datetime
from pydantic import BaseModel


class TranscriptUploadResponse(BaseModel):
    uploadId: str          # Used for WebSocket tracking
    transcriptId: str
    name: str
    status: str
    message: str = "Upload received, processing started"


class TranscriptOut(BaseModel):
    id: str
    name: str
    format: str
    status: str
    confidence: float | None = None
    speakers: int | None = None
    raw_text: str | None = None
    analysis: dict | None = None
    created_at: datetime
    processed_at: datetime | None = None

    model_config = {"from_attributes": True}
