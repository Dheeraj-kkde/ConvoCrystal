"""
Documents API — mirrors the mock API from frontend/src/app/lib/queries.ts

Endpoints:
  GET    /documents                         → DocumentItem[]
  DELETE /documents/{id}                    → 204
  GET    /documents/{id}/versions           → CommitNode[]
  GET    /documents/{id}/diff/{commitHash}  → DiffResult
  POST   /documents/{id}/restore            → { backupBranch }
"""

import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentCommit, DocumentStatus, DocumentDirection
from app.schemas.document import (
    DocumentItem,
    DocumentListResponse,
    CommitNode,
    DiffResult,
    DiffLine,
    RestoreRequest,
    RestoreResponse,
)
from app.utils.relative_time import relative_time

router = APIRouter(prefix="/documents", tags=["documents"])


def _doc_to_item(doc: Document) -> DocumentItem:
    """Convert a Document ORM model to the DocumentItem schema."""
    return DocumentItem(
        id=doc.id,
        name=doc.name,
        type=doc.doc_type.value,
        direction=doc.direction.value,
        status=doc.status.value,
        format=doc.format.upper(),
        size=doc.size_human,
        date=relative_time(doc.created_at),
        confidence=doc.confidence,
        speakers=doc.speakers,
        versions=len(doc.commits),
    )


def _commit_to_node(commit: DocumentCommit, is_latest: bool) -> CommitNode:
    return CommitNode(
        id=commit.id,
        hash=commit.hash,
        description=commit.description,
        author=commit.author_name,
        initials="".join(w[0].upper() for w in commit.author_name.split()[:2]),
        time=relative_time(commit.created_at),
        additions=commit.additions,
        deletions=commit.deletions,
        isLatest=is_latest,
        source=commit.source,
        branch=commit.branch,
        parentId=commit.parent_id,
    )


# ─── List documents ───────────────────────────────────────────────

@router.get("", response_model=DocumentListResponse)
async def list_documents(
    type: str | None = Query(None),
    status: str | None = Query(None),
    direction: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Document)
        .where(Document.owner_id == current_user.id)
        .options(selectinload(Document.commits))
        .order_by(Document.created_at.desc())
    )

    if type:
        q = q.where(Document.doc_type == type)
    if status:
        q = q.where(Document.status == status)
    if direction:
        q = q.where(Document.direction == direction)
    if search:
        q = q.where(Document.name.ilike(f"%{search}%"))

    result = await db.execute(q.offset(offset).limit(limit))
    docs = result.scalars().all()

    # Count total
    count_q = select(func.count()).where(Document.owner_id == current_user.id)
    total = (await db.execute(count_q)).scalar_one()

    return DocumentListResponse(
        items=[_doc_to_item(d) for d in docs],
        total=total,
    )


# ─── Delete document ──────────────────────────────────────────────

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Document not found"})

    await db.delete(doc)


# ─── Version history ──────────────────────────────────────────────

@router.get("/{document_id}/versions", response_model=list[CommitNode])
async def get_versions(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.id == document_id, Document.owner_id == current_user.id)
        .options(selectinload(Document.commits))
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Document not found"})

    commits = sorted(doc.commits, key=lambda c: c.created_at, reverse=True)
    latest_id = commits[0].id if commits else None
    return [_commit_to_node(c, c.id == latest_id) for c in commits]


# ─── Diff ─────────────────────────────────────────────────────────

@router.get("/{document_id}/diff/{commit_hash}", response_model=DiffResult)
async def get_diff(
    document_id: str,
    commit_hash: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find the commit by hash (7-char short hash)
    result = await db.execute(
        select(DocumentCommit)
        .join(Document)
        .where(
            Document.id == document_id,
            Document.owner_id == current_user.id,
            DocumentCommit.hash == commit_hash[:7],
        )
    )
    commit = result.scalar_one_or_none()
    if not commit:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Commit not found"})

    # Find parent commit for diff
    parent_content = {}
    if commit.parent_id:
        parent_result = await db.execute(
            select(DocumentCommit).where(DocumentCommit.id == commit.parent_id)
        )
        parent = parent_result.scalar_one_or_none()
        if parent and parent.content_snapshot:
            parent_content = parent.content_snapshot

    current_content = commit.content_snapshot or {}

    # Generate a simple diff from content snapshots
    diff_lines, stats = _generate_diff(parent_content, current_content, document_id)

    return DiffResult(
        lines=diff_lines,
        stats=stats,
        path=f"documents/{document_id}.md",
    )


def _generate_diff(
    old: dict, new: dict, document_id: str
) -> tuple[list[DiffLine], dict]:
    """Generate a minimal text diff from two content snapshots."""
    old_text = old.get("text", "") if old else ""
    new_text = new.get("text", "") if new else ""

    old_lines = old_text.splitlines()
    new_lines = new_text.splitlines()

    # Simple line diff using difflib
    import difflib
    differ = difflib.unified_diff(old_lines, new_lines, lineterm="")
    diff_lines: list[DiffLine] = []
    added = 0
    removed = 0
    old_num = 0
    new_num = 0

    for line in differ:
        if line.startswith("---") or line.startswith("+++") or line.startswith("@@"):
            continue
        if line.startswith("+"):
            new_num += 1
            added += 1
            diff_lines.append(DiffLine(type="added", numOld=None, numNew=new_num, text=line[1:]))
        elif line.startswith("-"):
            old_num += 1
            removed += 1
            diff_lines.append(DiffLine(type="removed", numOld=old_num, numNew=None, text=line[1:]))
        else:
            old_num += 1
            new_num += 1
            diff_lines.append(DiffLine(type="context", numOld=old_num, numNew=new_num, text=line[1:]))

    return diff_lines, {"added": added, "removed": removed}


# ─── Restore version ──────────────────────────────────────────────

@router.post("/{document_id}/restore", response_model=RestoreResponse)
async def restore_version(
    document_id: str,
    body: RestoreRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.id == document_id, Document.owner_id == current_user.id)
        .options(selectinload(Document.commits))
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Document not found"})

    # Find the target commit
    target_commit = next(
        (c for c in doc.commits if c.hash == body.commitHash[:7]), None
    )
    if not target_commit:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Commit not found"})

    # Create backup branch from current HEAD
    backup_branch = f"backup/{secrets.token_hex(4)}"

    # Create a restore commit on main
    restore_hash = secrets.token_hex(4)[:7]
    restore_commit = DocumentCommit(
        document_id=doc.id,
        parent_id=doc.head_commit_id,
        hash=restore_hash,
        description=body.note or f"Restore to {body.commitHash}",
        author_name=current_user.name,
        author_id=current_user.id,
        source="user",
        branch=doc.current_branch,
        content_snapshot=target_commit.content_snapshot,
        additions=0,
        deletions=0,
    )
    db.add(restore_commit)
    await db.flush()

    # Update document HEAD
    doc.head_commit_id = restore_commit.id
    if target_commit.content_snapshot:
        doc.content = target_commit.content_snapshot

    return RestoreResponse(backupBranch=backup_branch)
