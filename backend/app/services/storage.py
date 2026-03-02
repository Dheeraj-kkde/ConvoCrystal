"""
MinIO / S3-compatible file storage service.
"""

import logging
from io import BytesIO

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_client():
    from minio import Minio
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


async def ensure_bucket() -> None:
    """Create the bucket if it doesn't exist."""
    try:
        client = _get_client()
        if not client.bucket_exists(settings.MINIO_BUCKET_NAME):
            client.make_bucket(settings.MINIO_BUCKET_NAME)
            logger.info(f"Created MinIO bucket: {settings.MINIO_BUCKET_NAME}")
    except Exception as e:
        logger.warning(f"MinIO unavailable ({e}), file storage disabled")


async def upload_file(
    object_key: str,
    content: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload bytes to MinIO. Returns the object key."""
    try:
        client = _get_client()
        client.put_object(
            settings.MINIO_BUCKET_NAME,
            object_key,
            data=BytesIO(content),
            length=len(content),
            content_type=content_type,
        )
        return object_key
    except Exception as e:
        logger.error(f"MinIO upload failed: {e}")
        raise


async def download_file(object_key: str) -> bytes:
    """Download bytes from MinIO."""
    try:
        client = _get_client()
        response = client.get_object(settings.MINIO_BUCKET_NAME, object_key)
        return response.read()
    except Exception as e:
        logger.error(f"MinIO download failed: {e}")
        raise


async def delete_file(object_key: str) -> None:
    """Delete an object from MinIO."""
    try:
        client = _get_client()
        client.remove_object(settings.MINIO_BUCKET_NAME, object_key)
    except Exception as e:
        logger.warning(f"MinIO delete failed: {e}")


def get_presigned_url(object_key: str, expires_seconds: int = 3600) -> str:
    """Generate a pre-signed download URL."""
    from datetime import timedelta
    client = _get_client()
    return client.presigned_get_object(
        settings.MINIO_BUCKET_NAME,
        object_key,
        expires=timedelta(seconds=expires_seconds),
    )
