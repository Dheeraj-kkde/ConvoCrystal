import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class TranscriptStatus(str, enum.Enum):
    queued = "queued"
    parsing = "parsing"
    extracting = "extracting"
    analyzing = "analyzing"
    scoring = "scoring"
    processed = "processed"
    failed = "failed"


class TranscriptFormat(str, enum.Enum):
    vtt = "vtt"
    srt = "srt"
    txt = "txt"
    docx = "docx"
    json = "json"
    mp4 = "mp4"
    m4a = "m4a"
    wav = "wav"
    mp3 = "mp3"
    pdf = "pdf"


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    owner_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(512), nullable=False)
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_key: Mapped[str | None] = mapped_column(String(1024), nullable=True)  # MinIO object key

    status: Mapped[TranscriptStatus] = mapped_column(
        SAEnum(TranscriptStatus, name="transcript_status"),
        default=TranscriptStatus.queued,
        nullable=False,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Processing results
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    speakers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # AI analysis output (JSONB for flexibility)
    analysis: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Embedding stored in pgvector (column added via migration)
    # embedding: Mapped[list[float]] = mapped_column(Vector(768), nullable=True)

    sha256: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="transcripts")
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="transcript", cascade="all, delete-orphan"
    )
    chat_sessions: Mapped[list["ChatSession"]] = relationship(
        "ChatSession", back_populates="transcript", cascade="all, delete-orphan"
    )
    versions: Mapped[list["TranscriptVersion"]] = relationship(
        "TranscriptVersion", back_populates="transcript", cascade="all, delete-orphan"
    )


class TranscriptVersion(Base):
    """Processing version snapshots for audit trail."""

    __tablename__ = "transcript_versions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    transcript_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    stage: Mapped[str] = mapped_column(String(50), nullable=False)
    stage_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    transcript: Mapped["Transcript"] = relationship("Transcript", back_populates="versions")
