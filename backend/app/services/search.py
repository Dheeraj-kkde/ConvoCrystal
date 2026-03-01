"""
Semantic search service using pgvector + sentence-transformers.
"""

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings

logger = logging.getLogger(__name__)


async def embed_query(query: str) -> list[float]:
    """
    Generate an embedding vector for a query string.
    Uses Ollama embedding model or sentence-transformers as fallback.
    """
    try:
        # Try Ollama embeddings first
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/embeddings",
                json={"model": settings.OLLAMA_EMBED_MODEL, "prompt": query},
                timeout=10.0,
            )
            r.raise_for_status()
            return r.json()["embedding"]

    except Exception as e:
        logger.warning(f"Ollama embed failed ({e}), using sentence-transformers fallback")

    try:
        from sentence_transformers import SentenceTransformer
        import asyncio

        model = SentenceTransformer("all-MiniLM-L6-v2")
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(None, model.encode, query)
        return embedding.tolist()

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise


async def cosine_search(
    db: AsyncSession,
    owner_id: str,
    embedding: list[float],
    limit: int = 10,
) -> list[Any]:
    """
    Perform cosine similarity search against transcript embeddings.
    Requires pgvector extension and embedding column on transcripts table.
    """
    vector_str = "[" + ",".join(str(v) for v in embedding) + "]"

    result = await db.execute(
        text("""
            SELECT
                id, name, raw_text, created_at,
                1 - (embedding <=> :vector::vector) AS similarity
            FROM transcripts
            WHERE owner_id = :owner_id
              AND embedding IS NOT NULL
            ORDER BY embedding <=> :vector::vector
            LIMIT :limit
        """),
        {"vector": vector_str, "owner_id": owner_id, "limit": limit},
    )
    return result.fetchall()
