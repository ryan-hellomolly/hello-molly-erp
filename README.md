# Hello Molly ERP

Production ERP implementation for teams in Australia and China. This repository is intentionally separate from the ERP exploration, captured evidence and customer prototype repository.

## Phase 0 baseline

- Next.js 16 App Router with TypeScript and Tailwind CSS
- PostgreSQL 17 with Prisma 7
- Redis 8 with BullMQ 6
- MinIO for local S3-compatible object storage
- Mailpit for local email capture
- Credential authentication primitives using Argon2, short-lived JWT access tokens and revocable database sessions
- Vitest, ESLint and TypeScript validation

## Local setup

Prerequisites: Node.js 24+, npm 11+ and Docker Desktop.

```bash
cp .env.example .env
npm install
npm run infra:up
npm run db:generate
npm run db:migrate -- --name initial_identity
npm run dev
```

Open:

- Application: <http://localhost:3000>
- Health endpoint: <http://localhost:3000/api/health>
- MinIO console: <http://localhost:9001>
- Mailpit: <http://localhost:18025>

Run the queue worker in a second terminal:

```bash
npm run worker
```

## Quality checks

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

Run `npm run format` before committing. ESLint enforces code-quality rules; Prettier owns whitespace, wrapping, quotes and line length.

Never commit `.env`. Local credentials in `.env.example` are development-only and must not be reused outside a developer machine.
