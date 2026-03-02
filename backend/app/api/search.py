"""
Search API — semantic search across transcripts and documents using pgvector.

Endpoints:
  GET /search?q=...&limit=10
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.transcript import Transcript, TranscriptStatus
from app.utils.relative_time import relative_time

router = APIRouter(prefix="/search", tags=["search"])


class SearchResult(BaseModel):
    id: str
    type: str           # "transcript" | "document"
    name: str
    snippet: str
    date: str
    score: float


@router.get("", response_model=list[SearchResult])
async def semantic_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Perform semantic search using pgvector cosine similarity.

    Falls back to full-text ILIKE search if embeddings are not yet generated
    (e.g., Ollama embedding model not available).
    """
    results: list[SearchResult] = []

    try:
        # Try pgvector semantic search
        from app.services.search import embed_query, cosine_search
        query_embedding = await embed_query(q)
        rows = await cosine_search(db, current_user.id, query_embedding, limit)
        results = [
            SearchResult(
                id=row.id,
                type="transcript",
                name=row.name,
                snippet=_excerpt(row.raw_text or "", q),
                date=relative_time(row.created_at),
                score=float(row.similarity),
            )
            for row in rows
        ]
    except Exception:
        # Fall back to simple text search
        result = await db.execute(
            select(Transcript).where(
                Transcript.owner_id == current_user.id,
                Transcript.status == TranscriptStatus.processed,
                Transcript.raw_text.ilike(f"%{q}%"),
            ).limit(limit)
        )
        transcripts = result.scalars().all()
        results = [
            SearchResult(
                id=t.id,
                type="transcript",
                name=t.name,
                snippet=_excerpt(t.raw_text or "", q),
                date=relative_time(t.created_at),
                score=1.0,
            )
            for t in transcripts
        ]

    return results


def _excerpt(text: str, query: str, window: int = 120) -> str:
    """Return a short excerpt around the first occurrence of `query` in `text`."""
    idx = text.lower().find(query.lower())
    if idx == -1:
        return text[:window] + ("..." if len(text) > window else "")
    start = max(0, idx - window // 2)
    end = min(len(text), idx + window // 2)
    snippet = text[start:end]
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    return snippet
