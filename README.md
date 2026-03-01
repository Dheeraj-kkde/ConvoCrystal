# ConvoCrystal

> **Your Meetings, Finally Understood.**

ConvoCrystal is an open-source, AI-powered meeting intelligence app that turns raw transcripts into structured insights, action items, and living documents — in under 60 seconds. Built for developers, PMs, and technical team leads who run a lot of meetings and need to extract, document, and share what matters fast.

---

## ✨ Features

- **Transcript Upload & Processing** — Drag-and-drop upload supporting `.vtt`, `.srt`, `.txt`, and `.docx` formats with real-time progress and processing stage indicators.
- **AI-Powered Analysis** — Streaming analysis via Ollama (local LLMs): summaries, action items, decisions, open questions, and risk flags.
- **LLM Chat Interface** — Ask follow-up questions about any transcript (e.g. "Extract only items assigned to me", "Draft a follow-up email").
- **Live Document Editor** — ProseMirror-based editor to turn AI output into a shareable, version-controlled document.
- **Version Control** — Branch and commit history for every document so you can track how notes evolved.
- **Semantic Search** — Global search across all transcripts and documents using pgvector cosine similarity.
- **Cross-Meeting Analytics** — Quality scoring, confidence metrics, topic trends, and sentiment over time.

---

## 🏗️ Tech Stack

Everything here is free and open-source.

### Frontend

| Tool                    | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| Next.js 15 (App Router) | Framework — RSC + streaming               |
| TypeScript              | Strict mode throughout                    |
| Tailwind CSS            | Utility-first styling                     |
| shadcn/ui (Radix UI)    | Accessible component primitives           |
| ProseMirror + Y.js      | Live collaborative document editor (CRDT) |
| Zustand                 | Client-side state management              |
| TanStack Query v5       | Server state, caching, and streaming      |
| Framer Motion           | Animations and transitions                |
| Recharts                | Charts and data visualizations            |

### Backend

| Tool                 | Purpose                                    |
| -------------------- | ------------------------------------------ |
| FastAPI              | REST API + WebSocket + SSE endpoints       |
| PostgreSQL           | Primary database                           |
| pgvector             | Semantic search via vector embeddings      |
| SQLAlchemy + Alembic | ORM and database migrations                |
| Redis                | Background job queue + caching             |
| Celery               | Async task queue for transcript processing |
| MinIO                | S3-compatible local file storage           |

### AI / ML

| Tool                  | Purpose                                 |
| --------------------- | --------------------------------------- |
| Ollama                | Local LLM inference (no API key needed) |
| LangChain             | LLM chaining, RAG pipelines             |
| sentence-transformers | Local embeddings for pgvector           |
| RAGAS                 | Evaluation framework for RAG quality    |

### Dev & Testing

| Tool                    | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| Docker + Docker Compose | Local environment (Postgres, Redis, MinIO, Ollama) |
| pytest                  | Backend unit and integration tests                 |
| Vitest                  | Frontend unit tests                                |
| Playwright              | E2E tests                                          |

---

## 🗂️ Project Structure

```
convocrystal/
├── frontend/                 # Next.js app
│   ├── app/                  # App Router pages
│   │   ├── (marketing)/      # Public pages: /, /features, /pricing
│   │   ├── (auth)/           # /signup, /login, /onboarding
│   │   └── (app)/            # Authenticated workspace
│   │       ├── transcripts/  # Upload, view, and edit transcripts
│   │       ├── analysis/     # AI insights + chat interface
│   │       ├── documents/    # Live editor + version history
│   │       ├── insights/     # Cross-meeting analytics
│   │       └── settings/     # Profile, team, API keys
│   └── components/           # Shared UI components
│
├── backend/                  # FastAPI app
│   ├── api/                  # Route handlers
│   │   ├── transcripts.py
│   │   ├── analysis.py
│   │   ├── documents.py
│   │   └── auth.py
│   ├── core/                 # Config, security, dependencies
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   │   ├── ai/               # Ollama + LangChain pipeline
│   │   ├── storage.py        # MinIO file handling
│   │   └── search.py         # pgvector semantic search
│   ├── workers/              # Celery tasks
│   └── alembic/              # Database migrations
│
└── docker-compose.yml        # Local dev environment
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js 20+](https://nodejs.org/) and pnpm (`npm i -g pnpm`)
- [Python 3.11+](https://www.python.org/)
- [Ollama](https://ollama.com/) installed locally

### 1. Clone the repo

```bash
git clone https://github.com/your-username/convocrystal.git
cd convocrystal
```

### 2. Pull an Ollama model

Ollama runs LLMs locally — no API key required. Pull a model before starting:

```bash
# Recommended — good balance of speed and quality
ollama pull llama3.1

# Lighter option for lower-spec machines
ollama pull mistral
```

### 3. Start infrastructure with Docker

This spins up PostgreSQL, Redis, and MinIO:

```bash
docker compose up -d
```

### 4. Set up the backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
```

Edit `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/convocrystal

# Redis
REDIS_URL=redis://localhost:6379

# MinIO (local file storage)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=transcripts

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# Auth
SECRET_KEY=your-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

```bash
# Run database migrations
alembic upgrade head

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The API will be running at [http://localhost:8000](http://localhost:8000)  
Interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### 5. Start the Celery worker (separate terminal)

The transcript processing pipeline runs as a background Celery task:

```bash
cd backend
source venv/bin/activate
celery -A app.workers.celery worker --loglevel=info
```

### 6. Set up the frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Copy and configure environment variables
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

```bash
pnpm dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

---

## 🐳 Running Everything with Docker Compose

To run the full stack (frontend, backend, workers, and all services) in one command:

```bash
docker compose --profile full up
```

> **Note:** Make sure Ollama is running on your host machine before starting. The backend connects to it at `host.docker.internal:11434`.

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend unit tests
cd frontend
pnpm test

# E2E tests (requires full stack running)
cd frontend
pnpm test:e2e
```

---

## 📐 Architecture Overview

ConvoCrystal is built around five core modules:

1. **Upload Flow** — A 5-phase state machine (`IDLE → SELECTING → VALIDATING → UPLOADING → PROCESSING`) with chunked uploads, magic-byte format detection, and real-time WebSocket stage updates from the Celery worker.

2. **WebSocket Chat** — Streaming LLM chat (FastAPI WebSocket + Ollama streaming) scoped to a specific transcript, with full message history.

3. **Live Editor** — ProseMirror document editor with Y.js CRDT for real-time collaborative editing.

4. **Version Control** — Git-inspired branching and commit history for documents stored in PostgreSQL.

5. **Auth** — JWT-based authentication with optional OAuth (GitHub/Google) via FastAPI and python-jose.

---

## ⚡ Performance Targets

| Metric                                 | Target     |
| -------------------------------------- | ---------- |
| LLM First Token                        | < 800ms    |
| Transcript Processing (60-min meeting) | P50 < 45s  |
| API Response (CRUD)                    | P50 < 50ms |
| Semantic Search                        | < 200ms    |

> Performance varies based on your machine specs and which Ollama model you're running. A GPU will significantly improve LLM response times.

---

## 🎨 Design System

ConvoCrystal uses a custom design system built on an 8px grid:

- **Primary:** Crystal Blue `#5C6CF5`
- **Secondary:** Ice Teal `#00C9D6`
- **Typography:** Syne (display) + Lora (body) + DM Mono (code/metadata)
- **Supports:** Light and dark mode, WCAG AA compliant

---

## 🗺️ Roadmap

- [ ] Slack integration for automatic action item posting
- [ ] Zoom / Teams native bot for in-meeting transcription
- [ ] Mobile app (React Native)
- [ ] Support for more Ollama models + model switching in UI
- [ ] Public REST API

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

## 🙋 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
