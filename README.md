# AI Meeting Assistant

AI-powered meeting assistant that analyzes transcripts, extracts action items, detects CRM field changes, and drafts follow-up emails automatically.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React/TS   │────>│  Node.js API     │────>│  LLM Agent Layer    │
│  Frontend   │<────│  (Express)       │<────│  (OpenAI GPT-5.4)    │
└─────────────┘     └──────────────────┘     └─────────────────────┘
                           │                          │
                    ┌──────┴──────┐           ┌───────┴───────┐
                    │  PostgreSQL │           │  Function     │
                    │  (Prisma)   │           │  Calling      │
                    └─────────────┘           └───────────────┘
```

**Agent Pipeline:** Transcript → GPT-4o (function calling) → Structured extraction of action items, CRM changes, summary, and follow-up email → PostgreSQL storage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| AI | OpenAI GPT-4o with function calling |
| Infra | Docker Compose |

## Features

- **Meeting Upload** — Paste transcripts or drag-and-drop text files
- **AI Processing** — One-click analysis extracts structured data from conversations
- **Action Items** — Auto-extracted tasks with assignees and due dates
- **CRM Auto-Updates** — Detects client data changes (retirement targets, risk tolerance, income)
- **Follow-up Emails** — AI-drafted professional emails with copy-to-clipboard
- **Contact Management** — Searchable contact list with status filtering
- **Pipeline Kanban** — Drag-and-drop board (Prospect → Onboarding → Active → Inactive)

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- OpenAI API key

### Local Development

```bash
# Clone and install
git clone https://github.com/ZadBabaei/ai-meeting-assistant.git
cd ai-meeting-assistant
npm install

# Set up environment
cp .env.example server/.env
# Edit server/.env with your DATABASE_URL and OPENAI_API_KEY

# Set up database
cd server
npx prisma migrate dev --name init
cd ..

# Run both client and server
npm run dev:server  # Terminal 1
npm run dev:client  # Terminal 2
```

### Docker

```bash
# Set your OpenAI key
export OPENAI_API_KEY=sk-your-key

# Start everything
docker compose up --build
```

The app will be available at `http://localhost` (client) and `http://localhost:3001` (API).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings` | List all meetings |
| POST | `/api/meetings` | Create a meeting |
| GET | `/api/meetings/:id` | Meeting detail with extracted data |
| POST | `/api/meetings/:id/process` | Trigger AI analysis |
| DELETE | `/api/meetings/:id` | Delete a meeting |
| GET | `/api/contacts` | List contacts (supports `?search=` and `?status=`) |
| POST | `/api/contacts` | Create a contact |
| GET | `/api/contacts/:id` | Contact detail with meeting history |
| PATCH | `/api/contacts/:id` | Update a contact |
| DELETE | `/api/contacts/:id` | Delete a contact |

## Project Structure

```
ai-meeting-assistant/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Layout, shared components
│   │   ├── pages/             # Route pages
│   │   ├── lib/               # API client, types
│   │   └── main.tsx
│   └── Dockerfile
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Agent pipeline, processor
│   │   ├── lib/               # Prisma client
│   │   └── index.ts
│   ├── prisma/                # Database schema
│   └── Dockerfile
└── docker-compose.yml

- <!-- add-to-portfolio -->
```
