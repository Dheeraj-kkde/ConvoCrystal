# ConvoCrystal

ConvoCrystal is a full-stack, AI-powered meeting transcript analyzer. Upload audio, video, or text transcripts and let an LLM pipeline extract structured insights — summaries, action items, key decisions, risks, and open questions. Then refine the analysis interactively through an AI chat interface, track changes with git-like version control, and export polished documents.

## Features

- **Transcript Processing** — Upload files in multiple formats (VTT, SRT, TXT, DOCX, PDF, MP4, M4A, WAV, MP3). A background Celery pipeline parses, extracts, analyzes, and scores each transcript automatically.
- **AI Chat Interface** — Real-time WebSocket streaming lets you ask follow-up questions about any transcript with citations and confidence scores.
- **Smart Editor** — Rich-text document editor with AI-powered refinement actions: Refine, Expand, Shorten, Formalize, and Simplify.
- **Version Control** — Git-inspired commit history with branching, diffs, and content snapshots for every document revision.
- **Authentication** — JWT-based auth with refresh tokens, OAuth PKCE flow, email verification, and password reset.
- **Real-time Notifications** — WebSocket-powered notification system with persistent storage.
- **Analytics Dashboard** — Usage statistics and activity tracking across transcripts and documents.
- **Responsive Design** — Mobile, tablet, and desktop layouts with swipeable drawers and resizable panels.
- **Dark / Light Theme** — Full theme toggle support.
- **Document Export** — Export refined analysis as PDF or DOCX.

## Architecture

```
ConvoCrystal/
├── frontend/          # React + TypeScript SPA
├── backend/           # FastAPI + Python API server
├── docker-compose.yml # Infrastructure services
└── README.md
```

### Frontend (`frontend/`)

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | React 18 + TypeScript                   |
| Build Tool       | Vite                                    |
| UI Components    | Radix UI + shadcn/ui                    |
| Styling          | Tailwind CSS v4                         |
| State Management | Zustand                                 |
| Data Fetching    | React Query + custom WebSocket hooks    |
| Routing          | React Router v7                         |
| Animation        | Framer Motion                           |
| Charts           | Recharts                                |

**Key directories:**

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/     # Pages and shared components
│   │   │   ├── auth/       # Login, Register, Forgot Password
│   │   │   ├── ui/         # shadcn/ui primitives
│   │   │   └── ...         # Dashboard, Editor, Chat, Settings, etc.
│   │   ├── stores/         # Zustand stores (auth, user, theme, etc.)
│   │   ├── lib/            # API client, hooks, utilities
│   │   └── routes.ts       # Route definitions
│   └── main.tsx            # Entry point
├── index.html
├── package.json
└── vite.config.ts
```

### Backend (`backend/`)

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| Framework    | FastAPI + Uvicorn                          |
| Database     | PostgreSQL 16 + pgvector (async SQLAlchemy)|
| Cache/Queue  | Redis + Celery                             |
| File Storage | MinIO (S3-compatible)                      |
| AI / LLM     | Ollama (local) via LangChain              |
| Embeddings   | sentence-transformers                      |
| Auth         | JWT (python-jose) + bcrypt                 |
| Migrations   | Alembic                                    |

**Key directories:**

```
backend/
├── app/
│   ├── api/          # REST endpoints (auth, transcripts, documents, etc.)
│   ├── core/         # Config, database, security, dependencies
│   ├── models/       # SQLAlchemy ORM models
│   ├── schemas/      # Pydantic request/response schemas
│   ├── services/     # Business logic (AI pipeline, storage, search)
│   ├── workers/      # Celery background tasks
│   ├── ws/           # WebSocket handlers (chat, upload, notifications)
│   └── main.py       # FastAPI app entrypoint
├── alembic/          # Database migrations
├── requirements.txt
├── Dockerfile
└── .env.example
```

**API endpoints (v1):**

| Prefix           | Description                        |
| ---------------- | ---------------------------------- |
| `/auth`          | Login, register, OAuth, token refresh, password reset |
| `/transcripts`   | Upload, list, get, delete transcripts |
| `/documents`     | CRUD + version/commit management   |
| `/search`        | Semantic search with embeddings    |
| `/analytics`     | Usage statistics                   |
| `/users`         | Profile management                 |
| `/ws/chat`       | Real-time chat streaming           |
| `/ws/upload`     | Upload progress tracking           |
| `/ws/notifications` | Real-time notifications         |

### Infrastructure (Docker Compose)

| Service    | Image                   | Port  | Purpose                       |
| ---------- | ----------------------- | ----- | ----------------------------- |
| postgres   | pgvector/pgvector:pg16  | 5432  | Database with vector support  |
| redis      | redis:7-alpine          | 6379  | Cache + Celery broker         |
| minio      | minio/minio:latest      | 9000/9001 | S3-compatible file storage |
| backend    | Custom Dockerfile       | 8000  | FastAPI server (profile: full)|
| worker     | Custom Dockerfile       | —     | Celery worker (profile: full) |

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.11
- **Docker** and **Docker Compose**
- **Ollama** running locally (for LLM inference)

## Getting Started

### 1. Start infrastructure services

```bash
docker-compose up -d postgres redis minio
```

This starts PostgreSQL (with pgvector), Redis, and MinIO.

### 2. Run the backend

**Option A — With Docker (includes worker):**

```bash
docker-compose --profile full up -d
```

**Option B — Locally:**

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env as needed

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

To run the Celery worker (in a separate terminal):

```bash
cd backend
source venv/bin/activate
celery -A app.workers.celery worker --loglevel=info --concurrency=2
```

### 3. Run the frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:8000`.

### 4. Set up Ollama

Make sure Ollama is running and pull the required models:

```bash
ollama pull llama3.1
ollama pull nomic-embed-text
```

## Environment Variables

See `backend/.env.example` for the full list. Key variables:

| Variable                     | Default                          | Description                      |
| ---------------------------- | -------------------------------- | -------------------------------- |
| `DATABASE_URL`               | `postgresql+asyncpg://...`       | PostgreSQL connection string     |
| `REDIS_URL`                  | `redis://localhost:6379`         | Redis connection string          |
| `MINIO_ENDPOINT`             | `localhost:9000`                 | MinIO endpoint                   |
| `OLLAMA_BASE_URL`            | `http://localhost:11434`         | Ollama API URL                   |
| `OLLAMA_MODEL`               | `llama3.1`                       | LLM model for analysis           |
| `OLLAMA_EMBED_MODEL`         | `nomic-embed-text`               | Embedding model for search       |
| `SECRET_KEY`                 | —                                | JWT signing secret (change this!)|
| `ALLOWED_ORIGINS`            | `["http://localhost:5173", ...]` | CORS origins                     |
| `MAX_UPLOAD_SIZE_MB`         | `500`                            | Max file upload size              |

## License

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for third-party licenses.
