# AI Meeting Assistant — Claude Code Guidelines

## Git Workflow
- Work directly on `main` branch — no feature branches
- Commit and push after every major update
- All commits must be authored by "zad Babaei <zadbabaei@gmail.com>" — no Co-Authored-By lines
- Use descriptive commit messages with words, not numbers (e.g., "Add prisma schema for contacts and meetings" not "feat: #123")
- Push to origin/main after each commit

## Progress Tracking
- Update `context.md` checklist after each major milestone to reflect current progress

## Project
- Personal portfolio project demonstrating AI meeting assistant with auto-CRM updates
- Stack: React 18 + TypeScript + Tailwind (frontend), Node.js + Express + TypeScript (backend), PostgreSQL + Prisma, OpenAI/Claude API
- Monorepo structure with npm workspaces
