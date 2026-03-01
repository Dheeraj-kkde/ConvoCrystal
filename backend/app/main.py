from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.api import auth, documents, transcripts, analytics, users, search
from app.ws import chat as ws_chat, upload as ws_upload, notifications as ws_notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialise DB tables for dev (migrations handle prod)
    from app.core.database import engine, Base
    from app.models import *  # noqa: F401, F403 — import all models so metadata is populated
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: close DB pool
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# ─── REST Routers ─────────────────────────────────────────────────

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(transcripts.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)

# ─── WebSocket Routers ────────────────────────────────────────────

app.include_router(ws_chat.router)
app.include_router(ws_upload.router)
app.include_router(ws_notifications.router)


# ─── Health check ─────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
