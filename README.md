# CurrentPrompt v3.0

**Automated markdown publishing platform with AI-generated metadata, summaries, and semantic search capabilities.**

> Your personal knowledge module platform: Drop a markdown file → live on Webflow in 2 minutes with professional thumbnails, SEO metadata, summaries, and structured data—all automated.

## Status

**Current Phase:** 1 - Foundation ✅ Complete
**Next Phase:** 2 - AI Agent Pipeline
**Branch:** `automara/cp-v3-foundation`
**Commit:** `8495181`

## Project Overview

CurrentPrompt is Keith Armstrong's automated markdown publishing system that transforms local markdown files into professionally curated web content with:

- ✅ **AI-Generated Metadata** - 7 specialized agents create summaries, SEO, categories, tags
- ✅ **Quality Validation** - 100-point scoring system ensures excellence (70+ threshold)
- ✅ **Multi-Format Output** - Full markdown, summaries, ZIP bundles
- ✅ **Semantic Search** - Vector embeddings (3072 dimensions) for intelligent discovery
- ✅ **Webflow Integration** - Direct publishing to Webflow CMS
- ✅ **Cost Optimized** - ~$0.05 per module (90% reduction via model mix)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend/CMS** | Webflow | Public module library |
| **Admin Portal** | React + Vite + Tailwind v4 | Testing interface (Phase 5) |
| **Backend** | Node.js 20 + Express + TypeScript | API server |
| **Database** | Supabase (PostgreSQL + pgvector) | Metadata & embeddings |
| **AI Orchestration** | Mastra | Agent framework |
| **LLM Gateway** | OpenRouter | 200+ models |
| **Embeddings** | OpenAI text-embedding-3-large | 3072-dim vectors |
| **Security** | Helmet + rate-limit + Zod | Hardening |
| **Deployment** | Railway | Hosting |

## Quick Start

### Prerequisites

- Node.js 20.19+
- Supabase account
- OpenRouter API key
- OpenAI API key
- (Optional) Webflow account

### Installation

```bash
# Clone repository
git clone https://github.com/automara/cpv2.git
cd cpv2

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your API keys

# Build
npm run build

# Start server
npm start
```

Server runs on http://localhost:3000

### Environment Setup

See `.env.example` for all required variables. Minimum required:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-proj-...
```

### Database Setup

Run migrations in Supabase SQL Editor:

```sql
-- migrations/001_create_schema.sql
-- migrations/002_add_agent_fields.sql
-- migrations/003_fix_vector_dimensions.sql
```

Create storage bucket: `modules` (public)

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │         │   Backend    │         │  External    │
│   (React)    │◄───────►│  (Express)   │◄───────►│  Services    │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                ▼
                    ┌────────────────────┐
                    │  AI Agent Pipeline │
                    └────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │  Phase 1  │   │  Phase 2  │   │  Phase 3  │
        │ (Parallel)│   │ (Parallel)│   │(Sequential)│
        └───────────┘   └───────────┘   └───────────┘
                │               │               │
                ▼               ▼               ▼
        ┌───────────────────────────────────────────┐
        │         Supabase (DB + Storage)           │
        └───────────────────────────────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  Webflow CMS  │
                        └───────────────┐
```

## API Endpoints

```bash
GET  /health              # Health check
GET  /                    # API info
POST /api/modules/create  # Create module (JSON API)
GET  /api/modules         # List modules
GET  /api/modules/:slug   # Get specific module
DELETE /api/modules/:id   # Delete module
POST /api/modules/sync/:id # Sync to Webflow
POST /api/test-agents     # Test AI pipeline
```

## Development

```bash
# Development mode (with hot reload)
npm run dev

# Build
npm run build

# Run tests
npm test

# Run all tests with coverage
npm run test:all

# Lint
npm run lint

# Format code
npm run format
```

## Phase 1: Foundation ✅ Complete

**What's Built:**
- ✅ Node 20+ enforcement
- ✅ TypeScript strict mode
- ✅ Express server with health check
- ✅ Security middleware (auth, rate limiting, validation)
- ✅ Supabase client + migrations
- ✅ Database schema (modules, versions, embeddings)
- ✅ Testing framework (Jest)
- ✅ Deployment configuration (Railway)

**Test It:**
```bash
curl http://localhost:3000/health
# {"status":"healthy","timestamp":"...","environment":"development","version":"3.0.0"}
```

## Phase 2-7: Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **1. Foundation** | ✅ Complete | Node 20, TypeScript, Express, security |
| **2. AI Agents** | 🔜 Next | 7 specialized agents, Mastra workflow |
| **3. API & Storage** | 📋 Planned | CRUD, file handling, Supabase Storage |
| **4. Security** | ✅ Built-in | Already implemented in Phase 1 |
| **5. Admin Portal** | 📋 Planned | React frontend with drag & drop |
| **6. Testing** | 📋 Planned | 42 tests (integration, security, errors) |
| **7. Production** | 📋 Planned | Railway deploy, monitoring, docs |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Railway deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Create Railway project from repo
3. Set environment variables
4. Railway auto-deploys on push

## Security

**Built-in from Day 1:**
- Helmet security headers
- CORS whitelist
- API key authentication (optional)
- Rate limiting (prevents cost explosions)
- Zod input validation
- DOMPurify sanitization

**Rate Limits:**
- Module creation: 10/hour (prevents AI cost abuse)
- General API: 100/15min
- Authenticated users: 3x multiplier

## Cost Analysis

**Infrastructure (monthly):**
- Railway: ~$5
- Supabase: $0 (free tier)

**AI Processing (per module):**
- Gemini Flash (summaries): $0.001
- GPT-4o-mini (SEO): $0.002
- Claude Haiku (categories/tags): $0.006
- GPT-4o (schema, validation): $0.020
- Claude Sonnet (image prompts): $0.010
- OpenAI embeddings: $0.013
- **Total: ~$0.05/module** (90% cheaper than GPT-4 for all)

**Example costs:**
- 100 modules/month: $5 infrastructure + $5 AI = **$10/month**
- 1000 modules/month: $5 infrastructure + $50 AI = **$55/month**

## Contributing

This is a personal project by Keith Armstrong. For questions or issues:

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting
2. Review code comments and documentation
3. Contact: [your-contact-method]

## License

ISC

## Acknowledgments

Built with [Claude Code](https://claude.com/claude-code)

---

**Version:** 3.0.0
**Last Updated:** 2025-11-16
**Author:** Keith Armstrong
