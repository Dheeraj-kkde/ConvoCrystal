"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-02
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # ─── users ─────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("is_verified", sa.Boolean, default=False),
        sa.Column("oauth_provider", sa.String(50), nullable=True),
        sa.Column("oauth_subject", sa.String(255), nullable=True),
        sa.Column("verification_token_hash", sa.String(64), nullable=True),
        sa.Column("verification_token_expires", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reset_token_hash", sa.String(64), nullable=True),
        sa.Column("reset_token_expires", sa.DateTime(timezone=True), nullable=True),
        sa.Column("workspace_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # ─── transcript_status enum ────────────────────────────────────
    op.execute("""
        CREATE TYPE transcript_status AS ENUM
        ('queued','parsing','extracting','analyzing','scoring','processed','failed')
    """)

    # ─── transcripts ───────────────────────────────────────────────
    op.create_table(
        "transcripts",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("format", sa.String(20), nullable=False),
        sa.Column("size_bytes", sa.Integer, nullable=False),
        sa.Column("storage_key", sa.String(1024), nullable=True),
        sa.Column("status", sa.Enum("queued","parsing","extracting","analyzing","scoring","processed","failed", name="transcript_status"), nullable=False),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("raw_text", sa.Text, nullable=True),
        sa.Column("speakers", sa.Integer, nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("duration_seconds", sa.Integer, nullable=True),
        sa.Column("analysis", JSONB, nullable=True),
        sa.Column("sha256", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_transcripts_owner_id", "transcripts", ["owner_id"])
    op.create_index("ix_transcripts_sha256", "transcripts", ["sha256"])
    op.create_index("ix_transcripts_created_at", "transcripts", ["created_at"])

    # Add pgvector embedding column
    op.execute("ALTER TABLE transcripts ADD COLUMN embedding vector(768)")

    # ─── transcript_versions ───────────────────────────────────────
    op.create_table(
        "transcript_versions",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("transcript_id", UUID(as_uuid=False), sa.ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stage", sa.String(50), nullable=False),
        sa.Column("stage_index", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ─── document enums ────────────────────────────────────────────
    op.execute("""
        CREATE TYPE document_type AS ENUM
        ('transcript','analysis','summary','audio','video','pdf','docx')
    """)
    op.execute("""
        CREATE TYPE document_direction AS ENUM ('uploaded','exported')
    """)
    op.execute("""
        CREATE TYPE document_status AS ENUM ('processing','processed','failed')
    """)

    # ─── documents ─────────────────────────────────────────────────
    op.create_table(
        "documents",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("transcript_id", UUID(as_uuid=False), sa.ForeignKey("transcripts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("doc_type", sa.Enum("transcript","analysis","summary","audio","video","pdf","docx", name="document_type"), nullable=False),
        sa.Column("direction", sa.Enum("uploaded","exported", name="document_direction"), nullable=False),
        sa.Column("status", sa.Enum("processing","processed","failed", name="document_status"), nullable=False),
        sa.Column("format", sa.String(20), nullable=False),
        sa.Column("size_bytes", sa.Integer, default=0),
        sa.Column("storage_key", sa.String(1024), nullable=True),
        sa.Column("confidence", sa.Integer, nullable=True),
        sa.Column("speakers", sa.Integer, nullable=True),
        sa.Column("content", JSONB, nullable=True),
        sa.Column("current_branch", sa.String(255), default="main"),
        sa.Column("head_commit_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_documents_owner_id", "documents", ["owner_id"])
    op.create_index("ix_documents_created_at", "documents", ["created_at"])

    # ─── document_commits ──────────────────────────────────────────
    op.create_table(
        "document_commits",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("document_id", UUID(as_uuid=False), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", UUID(as_uuid=False), sa.ForeignKey("document_commits.id", ondelete="SET NULL"), nullable=True),
        sa.Column("hash", sa.String(7), nullable=False),
        sa.Column("description", sa.String(512), nullable=False),
        sa.Column("author_name", sa.String(255), nullable=False),
        sa.Column("author_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source", sa.String(20), default="user"),
        sa.Column("branch", sa.String(255), default="main"),
        sa.Column("additions", sa.Integer, default=0),
        sa.Column("deletions", sa.Integer, default=0),
        sa.Column("content_snapshot", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_document_commits_document_id", "document_commits", ["document_id"])

    # ─── message_role enum ─────────────────────────────────────────
    op.execute("CREATE TYPE message_role AS ENUM ('user','assistant')")

    # ─── chat_sessions ─────────────────────────────────────────────
    op.create_table(
        "chat_sessions",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("transcript_id", UUID(as_uuid=False), sa.ForeignKey("transcripts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("is_starred", sa.Boolean, default=False),
        sa.Column("avg_confidence", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ─── chat_messages ─────────────────────────────────────────────
    op.create_table(
        "chat_messages",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("session_id", UUID(as_uuid=False), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.Enum("user","assistant", name="message_role"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("confidence", JSONB, nullable=True),
        sa.Column("citations", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # ─── activity_logs ─────────────────────────────────────────────
    op.create_table(
        "activity_logs",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target", sa.String(512), nullable=False),
        sa.Column("format", sa.String(50), nullable=True),
        sa.Column("metadata", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_activity_logs_user_id", "activity_logs", ["user_id"])
    op.create_index("ix_activity_logs_created_at", "activity_logs", ["created_at"])

    # ─── notifications ─────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("icon_type", sa.String(50), nullable=False),
        sa.Column("color", sa.String(20), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.String(1024), nullable=False),
        sa.Column("toast_variant", sa.String(20), nullable=False),
        sa.Column("unread", sa.Boolean, default=True),
        sa.Column("dismissed", sa.Boolean, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("activity_logs")
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
    op.drop_table("document_commits")
    op.drop_table("documents")
    op.drop_table("transcript_versions")
    op.drop_table("transcripts")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS message_role")
    op.execute("DROP TYPE IF EXISTS document_status")
    op.execute("DROP TYPE IF EXISTS document_direction")
    op.execute("DROP TYPE IF EXISTS document_type")
    op.execute("DROP TYPE IF EXISTS transcript_status")
    op.execute("DROP EXTENSION IF EXISTS vector")
