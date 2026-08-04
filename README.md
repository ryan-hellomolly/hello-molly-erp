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
- English ERP workspace: <http://localhost:3000/en-AU/workspace>
- Chinese ERP workspace: <http://localhost:3000/zh-CN/workspace>
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
npm run test:coverage
npm run build
```

Run `npm run format` before committing. ESLint enforces code-quality rules; Prettier owns whitespace, wrapping, quotes and line length.

Never commit `.env`. Local credentials in `.env.example` are development-only and must not be reused outside a developer machine.

## Authentication architecture

Credential authentication uses Argon2id, short-lived JWT access cookies, hashed rotating refresh credentials and revocable PostgreSQL sessions. `AuthService` is the application boundary; route handlers and Server Actions do not depend directly on the credential implementation. `OidcAdapter` is reserved for a future enterprise identity provider and is intentionally not implemented in Phase 0.

Set `SEED_ADMIN_PASSWORD` in `.env`, run `npm run db:seed`, then sign in at `/login` with `admin@hellomolly.com.au`. Never use the local development password in a shared or deployed environment.

Backend authentication tests include unit and PostgreSQL integration coverage. `npm test` creates uniquely named temporary records and removes them after the suite. Use `npm run test:coverage` to generate the report under `coverage/`.

Authentication coverage is enforced at a starting floor of 40% statements, 35% branches, 50% functions and 40% lines. These are regression floors, not quality targets; raise them as the service layer grows. Cookie/header orchestration is complemented by runtime route verification, while credential, reset, refresh, ownership and revocation rules are database-tested.

## ERP application shell

The authenticated shell is locale-routed under `/{locale}/workspace`. Its typed navigation configuration contains the fifteen top-level modules evidenced by the reference ERP and supports nested menu items plus role-based filtering. `en-AU` and `zh-CN` are the initial route locales; persistence of user language preference and full domain message dictionaries remain subsequent internationalisation work.

## Customer master

The bilingual customer list at `/{locale}/workspace/master-data/customers` reads from PostgreSQL with server-side search, sorting and pagination. `GET /api/customers` requires an authenticated session; `POST /api/customers` additionally requires `SYSTEM_ADMIN` and trusted-origin validation. Duplicate protection covers case-insensitive customer codes and normalized customer name plus country. Customer service database tests are included in the enforced backend coverage report.
