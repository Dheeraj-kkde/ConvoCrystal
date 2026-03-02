import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class DocumentType(str, enum.Enum):
    transcript = "transcript"
    analysis = "analysis"
    summary = "summary"
    audio = "audio"
    video = "video"
    pdf = "pdf"
    docx = "docx"


class DocumentDirection(str, enum.Enum):
    uploaded = "uploaded"
    exported = "exported"


class DocumentStatus(str, enum.Enum):
    processing = "processing"
    processed = "processed"
    failed = "failed"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    owner_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transcript_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("transcripts.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(512), nullable=False)
    doc_type: Mapped[DocumentType] = mapped_column(
        SAEnum(DocumentType, name="document_type"), nullable=False
    )
    direction: Mapped[DocumentDirection] = mapped_column(
        SAEnum(DocumentDirection, name="document_direction"), nullable=False
    )
    status: Mapped[DocumentStatus] = mapped_column(
        SAEnum(DocumentStatus, name="document_status"), default=DocumentStatus.processed
    )

    format: Mapped[str] = mapped_column(String(20), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    storage_key: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # Metadata
    confidence: Mapped[float | None] = mapped_column(Integer, nullable=True)
    speakers: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Editor content (ProseMirror JSON)
    content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Current branch / HEAD
    current_branch: Mapped[str] = mapped_column(String(255), default="main")
    head_commit_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="documents")
    transcript: Mapped["Transcript"] = relationship("Transcript", back_populates="documents")
    commits: Mapped[list["DocumentCommit"]] = relationship(
        "DocumentCommit", back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentCommit.created_at.desc()",
    )

    @property
    def version_count(self) -> int:
        return len(self.commits)

    @property
    def size_human(self) -> str:
        """Human-readable file size."""
        if self.size_bytes < 1024:
            return f"{self.size_bytes} B"
        elif self.size_bytes < 1024 * 1024:
            return f"{self.size_bytes / 1024:.1f} KB"
        elif self.size_bytes < 1024 * 1024 * 1024:
            return f"{self.size_bytes / (1024 * 1024):.1f} MB"
        else:
            return f"{self.size_bytes / (1024 * 1024 * 1024):.1f} GB"


class DocumentCommit(Base):
    """Git-inspired version commit for a document."""

    __tablename__ = "document_commits"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    document_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("document_commits.id", ondelete="SET NULL"), nullable=True
    )

    hash: Mapped[str] = mapped_column(String(7), nullable=False)  # short git-style hash
    description: Mapped[str] = mapped_column(String(512), nullable=False)
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    author_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    source: Mapped[str] = mapped_column(String(20), default="user")  # "user" | "ai"
    branch: Mapped[str] = mapped_column(String(255), default="main")

    additions: Mapped[int] = mapped_column(Integer, default=0)
    deletions: Mapped[int] = mapped_column(Integer, default=0)

    # Snapshot of document content at this commit
    content_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="commits")
    children: Mapped[list["DocumentCommit"]] = relationship(
        "DocumentCommit", foreign_keys=[parent_id]
    )
