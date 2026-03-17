# Project 1: AI Meeting Assistant with Auto-CRM Updates

## Why This Project

Verlo Finance's core product does exactly this — it joins meetings, transcribes them, extracts action items, and auto-updates CRM fields from conversation context. Building a working version of this demonstrates you understand their hardest problem: turning unstructured conversation into structured data reliably.

This project directly maps to their job posting requirements:
- LLM-powered features shipped to real users
- Prompt engineering & agent orchestration
- React + TypeScript frontend, Node.js backend, AWS infra
- Agentic workflows that don't fall apart in production

---

## What We're Building

A web app where a user can upload or record a meeting (audio/transcript), and the system:

1. Transcribes the audio (if audio input)
2. Uses an LLM agent to extract structured data: action items, key decisions, CRM field changes, follow-up emails
3. Displays everything in a clean dashboard
4. Auto-generates a draft follow-up email based on meeting context
5. Shows "CRM field changes detected" (e.g., "Retirement target → Age 62")

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React/TS   │────▶│  Node.js API     │────▶│  LLM Agent Layer    │
│  Frontend   │◀────│  (Express/Fastify)│◀────│  (OpenAI / Claude)  │
└─────────────┘     └──────────────────┘     └─────────────────────┘
                           │                          │
                    ┌──────┴──────┐           ┌───────┴───────┐
                    │  PostgreSQL │           │  Whisper API  │
                    │  (Contacts, │           │  (Transcribe) │
                    │   Meetings) │           └───────────────┘
                    └─────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + TypeScript + Tailwind CSS | Matches Verlo's stack exactly |
| Backend | Node.js + Express (or Fastify) | Matches Verlo's stack exactly |
| Database | PostgreSQL (via Prisma ORM) | Production-grade, relational data fits CRM model |
| LLM | OpenAI GPT-4o or Claude API | Core intelligence layer |
| Transcription | OpenAI Whisper API | Audio → text |
| Agent Framework | LangChain.js or custom orchestration | Mentioned in Verlo's nice-to-haves |
| Infra | AWS (Lambda + API Gateway + RDS) or Docker Compose locally | Matches their AWS requirement |
| Auth | WorkOS or NextAuth | WorkOS is what Verlo uses (AuthKit visible in their login URL) |

---

## How We Attack It

### Phase 1: Foundation (Day 1-2)
- Set up monorepo (Turborepo or simple npm workspaces)
- Scaffold React + TypeScript frontend with Vite
- Scaffold Node.js + Express backend
- Set up PostgreSQL with Prisma schema (Contacts, Meetings, ActionItems, CRMChanges)
- Basic CRUD API for contacts and meetings

### Phase 2: LLM Agent Pipeline (Day 3-4)
- Build the transcript processing agent
- Design prompts for: extraction of action items, CRM field detection, follow-up email drafting
- Implement structured output parsing (JSON mode / function calling)
- Add Whisper integration for audio upload
- Build the agent loop: transcript → extract → validate → store

### Phase 3: Frontend Dashboard (Day 5-6)
- Meeting upload/input page
- Meeting detail view showing: transcript, extracted action items, detected CRM changes
- Contact list view with enriched data
- Auto-generated follow-up email preview (editable)
- Pipeline/kanban board for contacts

### Phase 4: Polish & Deploy (Day 7)
- Error handling and edge cases in the agent
- Loading states, empty states, responsive design
- Deploy: Vercel (frontend) + Railway or AWS (backend + DB)
- Write a solid README with demo video/screenshots

---

## Checklist

### Setup
- [x] Initialize monorepo structure
- [x] Set up React + TypeScript + Vite + Tailwind frontend
- [x] Set up Node.js + Express + TypeScript backend
- [x] Configure PostgreSQL + Prisma ORM
- [x] Define database schema (Contact, Meeting, ActionItem, CRMFieldChange, FollowUpEmail)
- [x] Set up environment variables (.env) for API keys

### Backend — API
- [x] POST /api/meetings — upload transcript or audio file
- [x] GET /api/meetings — list all meetings
- [x] GET /api/meetings/:id — meeting detail with extracted data
- [x] GET /api/contacts — list contacts with enriched data
- [x] GET /api/contacts/:id — contact detail with meeting history
- [x] POST /api/meetings/:id/process — trigger LLM agent processing

### Backend — Agent Pipeline
- [ ] Whisper integration: audio file → transcript text
- [x] LLM prompt for action item extraction (structured JSON output)
- [x] LLM prompt for CRM field change detection
- [x] LLM prompt for follow-up email generation
- [x] Agent orchestration: chain the above steps with error handling
- [ ] Retry logic and fallback for LLM failures
- [x] Store all extracted data back to PostgreSQL

### Frontend
- [x] Navigation layout (sidebar with Contacts, Meetings, Pipeline)
- [x] Meeting upload page (drag-and-drop audio or paste transcript)
- [x] Meeting detail page — show transcript with highlighted entities
- [x] Action items panel with status toggles (todo/done/overdue)
- [x] CRM field changes panel with "approve/dismiss" buttons
- [x] Follow-up email preview with edit + copy functionality
- [x] Contact list with search, filter, status badges
- [x] Contact detail page — meeting history timeline
- [x] Pipeline kanban board (Prospect → Onboarding → Active)

### Quality & Deployment
- [x] Add loading skeletons and error boundaries
- [ ] Write at least 3-5 unit tests for the agent pipeline
- [x] Dockerize the full stack (docker-compose.yml)
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend + DB to Railway or AWS
- [ ] Record a 2-minute demo video
- [x] Write README with architecture diagram, setup instructions, and demo link

---

## What Makes This Stand Out for Verlo

1. It's literally a simplified version of their product — shows you get what they're building
2. Demonstrates LLM agent orchestration in production (their #1 hiring signal)
3. Uses their exact tech stack (React/TS, Node.js, AWS)
4. Shows you can ship end-to-end, not just write isolated code
5. The "CRM auto-update from conversation" feature is their secret sauce — building it shows deep understanding
