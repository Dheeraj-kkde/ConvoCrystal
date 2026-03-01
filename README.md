# ConvoCrystal

> **Your Meetings, Finally Understood.**

ConvoCrystal is an AI-powered meeting intelligence SaaS that turns raw transcripts into structured insights, action items, and living documents — in under 60 seconds. Built for developers, PMs, and technical team leads who run a lot of meetings and need to extract, document, and share what matters fast.

---

## ✨ Features

- **Transcript Upload & Processing** — Drag-and-drop upload supporting `.vtt`, `.srt`, `.txt`, and `.docx` formats with real-time chunked upload progress and stage indicators.
- **AI-Powered Analysis** — Streaming analysis powered by Claude API: summaries, action items, decisions, open questions, and risk flags.
- **LLM Chat Interface** — Ask follow-up questions about any transcript (e.g. "Extract only items assigned to me", "Draft a follow-up email").
- **Live Document Editor** — ProseMirror-based collaborative editor to turn AI output into a shareable, version-controlled document.
- **Version Control** — Branch and commit history for every document, so you can track how your notes evolved.
- **Semantic Search** — Global search across all transcripts and documents using pgvector cosine similarity.
- **Cross-Meeting Analytics** — Quality scoring, confidence metrics, topic trends, and sentiment over time.
- **Integrations** — Connects with Microsoft Teams, Zoom, and Google Meet.

---

## 🏗️ Tech Stack

### Frontend

| Tool                    | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| Next.js 15 (App Router) | Framework — RSC + streaming, edge-ready, ISR |
| TypeScript 5.5+         | Strict mode throughout                       |
| Tailwind CSS 4          | Utility-first styling with CSS variables     |
| shadcn/ui (Radix UI)    | Component primitives                         |
| ProseMirror + Y.js      | Live collaborative document editor with CRDT |
| Zustand                 | Client-side state management                 |
| TanStack Query v5       | Server state, caching, and streaming         |
| Framer Motion           | Animations and transitions                   |
| D3.js + Recharts        | Charts and data visualizations               |

### Backend & API

| Tool                     | Purpose                                        |
| ------------------------ | ---------------------------------------------- |
| Next.js API Routes       | REST endpoints and SSE handlers                |
| Hono.js                  | Edge API for high-throughput routes            |
| Supabase                 | Auth, Realtime, Row-Level Security             |
| PostgreSQL 16 + pgvector | Primary database + semantic search embeddings  |
| Prisma                   | Type-safe DB access with migrations            |
| BullMQ + Redis           | Background job queue for transcript processing |

### AI / ML

| Tool                                         | Purpose                                 |
| -------------------------------------------- | --------------------------------------- |
| Anthropic Claude API (`claude-3-7-sonnet`)   | Primary LLM for analysis and chat       |
| OpenAI Embeddings (`text-embedding-3-small`) | Embeddings for pgvector semantic search |
| Vercel AI SDK                                | Unified streaming interface             |
| LangChain (optional)                         | Complex multi-step reasoning chains     |

### Infrastructure

| Tool           | Purpose                                  |
| -------------- | ---------------------------------------- |
| Vercel         | Hosting, edge functions, preview deploys |
| Supabase Cloud | Managed Postgres + Auth + Realtime       |
| Cloudflare R2  | Transcript file storage (S3-compatible)  |
| Cloudflare CDN | Static asset caching                     |
| Upstash Redis  | Edge cache, rate limiting, session store |
| Railway        | BullMQ worker hosting                    |
| Stripe         | Billing and subscriptions                |
| Resend         | Transactional email                      |
| Sentry         | Error tracking + performance monitoring  |
| PostHog        | Product analytics + session replay       |

### Testing

| Tool       | Purpose                        |
| ---------- | ------------------------------ |
| Vitest     | Unit and integration tests     |
| Playwright | E2E tests + visual regression  |
| MSW        | API mocking                    |
| Storybook  | Component development and docs |

---

## 🗂️ Project Structure

```
/
├── app/                  # Next.js App Router pages
│   ├── (marketing)/      # Public pages: /, /features, /pricing, /blog, /docs
│   ├── (auth)/           # /signup, /login, /onboarding
│   └── (app)/            # Authenticated workspace
│       ├── transcripts/  # Upload, view, and edit transcripts
│       ├── analysis/     # AI insights + chat interface
│       ├── documents/    # Live editor + version history
│       ├── insights/     # Cross-meeting analytics
│       ├── search/       # Global semantic search
│       └── settings/     # Profile, team, billing, API keys
├── components/           # Shared UI components
├── lib/                  # Utilities, API clients, helpers
├── prisma/               # Database schema and migrations
└── workers/              # BullMQ background processing workers
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)
- An [OpenAI API key](https://platform.openai.com) (for embeddings)
- Redis (local via Docker, or [Upstash](https://upstash.com))
- Cloudflare R2 bucket (or any S3-compatible storage)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/convocrystal.git
cd convocrystal
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# Redis
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=your_upstash_url       # if using Upstash
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Storage
CLOUDFLARE_R2_ACCOUNT_ID=your_r2_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret
CLOUDFLARE_R2_BUCKET_NAME=transcripts

# Stripe
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Resend
RESEND_API_KEY=your_resend_key

# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

### 4. Set up the database

```bash
# Run Prisma migrations
pnpm prisma migrate dev

# Seed the database (optional)
pnpm prisma db seed
```

Make sure the `pgvector` extension is enabled in your Supabase project:

```sql
create extension if not exists vector;
```

### 5. Start the development server

```bash
pnpm dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

### 6. Start the background worker (separate terminal)

The transcript processing pipeline runs in a separate BullMQ worker:

```bash
pnpm worker:dev
```

---

## 🧪 Running Tests

```bash
# Unit and integration tests
pnpm test

# E2E tests (requires dev server running)
pnpm test:e2e

# Component development
pnpm storybook
```

---

## 📐 Architecture Overview

ConvoCrystal is built around five core modules:

1. **Upload Flow** — A 5-phase state machine (`IDLE → SELECTING → VALIDATING → UPLOADING → PROCESSING`) with chunked uploads, magic-byte format detection, and real-time WebSocket stage updates.

2. **WebSocket Chat** — Streaming LLM chat interface scoped to a specific transcript, with message history and context management.

3. **Live Editor** — Collaborative ProseMirror document editor with Y.js CRDT, supporting real-time multi-user editing.

4. **Version Control** — Git-inspired branching and commit history for documents, so teams can track changes over time.

5. **Auth Lifecycle** — Supabase Auth with GitHub OAuth + magic link, protected routes, and workspace-level permissions.

---

## ⚡ Performance Targets

| Metric                                | Target                             |
| ------------------------------------- | ---------------------------------- |
| LCP                                   | < 1.2s (desktop) / < 1.8s (mobile) |
| INP                                   | < 80ms P75                         |
| TTFB                                  | < 120ms                            |
| LLM First Token                       | < 800ms                            |
| Transcript Processing (60min meeting) | P50 < 45s, P95 < 90s               |
| API Response (CRUD)                   | P50 < 35ms                         |
| Initial JS Bundle                     | < 180KB gzipped                    |

---

## 🎨 Design System

ConvoCrystal uses a custom design system built on an 8px grid with the following token system:

- **Primary Color:** Crystal Blue `#5C6CF5`
- **Secondary:** Ice Teal `#00C9D6`
- **Typography:** Syne (display) + Lora (body) + DM Mono (code/metadata)
- **Type Scale:** 9-step Major Third scale
- **Radii:** Panels `12px`, Cards `16px`, Pills `100px`
- **Supports:** Light and dark mode, WCAG AA compliant

Full design system documentation is available in [`convocrystal-design-system.html`](./docs/convocrystal-design-system.html).

---

## 🗺️ Roadmap

- [ ] Slack integration for automatic action item posting
- [ ] Zoom / Teams native bot for in-meeting transcription
- [ ] Mobile app (React Native)
- [ ] Custom AI model fine-tuning per workspace
- [ ] Public API + webhook support

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
