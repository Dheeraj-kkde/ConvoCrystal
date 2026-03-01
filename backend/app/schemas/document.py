from datetime import datetime
from typing import Literal
from pydantic import BaseModel


# ─── Document List item (matches frontend DocumentItem type) ──────

class DocumentItem(BaseModel):
    id: str
    name: str
    type: Literal["transcript", "analysis", "summary", "audio", "video", "pdf", "docx"]
    direction: Literal["uploaded", "exported"]
    status: Literal["processed", "processing", "failed"]
    format: str
    size: str           # human-readable, e.g. "248 MB"
    date: str           # relative time, e.g. "2h ago"
    confidence: int | None = None
    speakers: int | None = None
    versions: int

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentItem]
    total: int


# ─── Version Control (CommitNode matches frontend type) ───────────

class CommitNode(BaseModel):
    id: str
    hash: str
    description: str
    author: str
    initials: str
    time: str           # relative, e.g. "12 min ago"
    additions: int
    deletions: int
    isLatest: bool = False
    source: Literal["user", "ai"] = "user"
    branch: str
    parentId: str | None

    model_config = {"from_attributes": True}


# ─── Diff (matches frontend DiffLine / DiffResult) ────────────────

class DiffLine(BaseModel):
    type: Literal["context", "removed", "added"]
    numOld: int | None
    numNew: int | None
    text: str


class DiffResult(BaseModel):
    lines: list[DiffLine]
    stats: dict  # {"added": int, "removed": int}
    path: str


# ─── Restore ──────────────────────────────────────────────────────

class RestoreRequest(BaseModel):
    commitHash: str
    note: str


class RestoreResponse(BaseModel):
    backupBranch: str
