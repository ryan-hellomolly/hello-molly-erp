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

The bilingual customer list at `/{locale}/workspace/master-data/customers` reads from PostgreSQL with server-side search, sorting and pagination. Each customer has an administrator-only detail workspace for editing, activation/deactivation and immutable audit history. `GET /api/customers` requires an authenticated session; customer creation and `PATCH /api/customers/{id}` require `SYSTEM_ADMIN` plus trusted-origin validation. `GET /api/customers/{id}/audit` exposes that customer's audit history to administrators. Duplicate protection covers case-insensitive customer codes and normalized customer name plus country. Customer service database tests cover create, duplicate detection, search, pagination, editing, status changes, missing records and audit history, and are included in the enforced backend coverage report.

## Supplier master

The bilingual supplier workspace at `/{locale}/workspace/master-data/suppliers` supports search, creation, contact/category maintenance, active/suspended/inactive states, certifications and audit history. Certification health is derived from expiry dates as `VALID`, `EXPIRING` (within 60 days) or `EXPIRED`; an expiry date cannot precede its effective date. Supplier codes and normalized supplier name plus country are duplicate-protected. Mutations require `SYSTEM_ADMIN` and trusted-origin validation. Supplier database tests are included in the enforced backend coverage report.

## Factory master

The bilingual factory workspace at `/{locale}/workspace/master-data/factories` supports search, administrator-only creation and management, contact details, normalized capability tags, active/on-hold/inactive status and immutable audit history. Factory codes and normalized factory name plus country are duplicate-protected. All mutations require `SYSTEM_ADMIN` and trusted-origin validation. Factory database tests are included in the enforced backend coverage report.

## Warehouse master

The bilingual warehouse workspace at `/{locale}/workspace/master-data/warehouses` manages warehouses and warehouse-scoped locations. Ownership is explicit (`HELLO_MOLLY`, `THIRD_PARTY`, `FACTORY` or `SUPPLIER`), with an owner name required for external ownership. Warehouse codes are globally unique and location codes are unique within each warehouse. Administrators can create, edit, activate/deactivate and add locations with immutable audit history, trusted-origin validation, loading states and duplicate-submit protection.

## Reference data

Reference data now follows the original ERP's independent navigation instead of one merged workspace. Master Data exposes separate pages for settlement methods, invoice types, sample types, expense types, size sorting and sales channels; finished-goods units live under Style Design and material units under Material Development. The legacy `/{locale}/workspace/master-data/reference-data` route redirects to Size Sorting. All pages share the audited reference-data API while filtering to their own type, so codes remain unique within each independent module. Administrators can create and edit every field, safely delete a value through confirmed deactivation, and restore it later; historical transaction references are preserved and every mutation is audited. Currency and trade-term records remain supported internally but are no longer mixed into the Master Data navigation.

## Master Data CRUD policy

Every current Master Data navigation module has administrator create, edit and delete capability. Delivery addresses, cashier accounts, construction templates and measurement templates use confirmed physical deletion because their records are self-contained. Customers, factories, suppliers, warehouses and shared reference values use confirmed soft deletion (`INACTIVE`) because they may already be referenced by historical ERP transactions; these records can be restored without breaking auditability. Mutations use loading locks, trusted-origin checks and immutable audit events.

## Delivery addresses and cashier accounts

Dedicated Master Data modules mirror the original ERP fields. Delivery Addresses maintains ordered reusable address records. Cashier Accounts maintains QR-code URL, account name, routing number, account number, currency, address and notes with unique account-number/currency protection. Administrator create, edit and confirmed-delete actions are trusted-origin protected and audited.

## Template masters

Two bilingual workspaces mirror the original ERP navigation: `/{locale}/workspace/master-data/templates/construction` for construction requirement templates and `/{locale}/workspace/master-data/templates/measurement` for measurement chart templates. They share the same versioned template service while keeping their menus, creation forms and records separate. Construction requirements use a Word-style, server-sanitized rich-text editor with tables, links, MinIO/S3-backed images, `.docx` import, preview, print and fullscreen editing. Measurement templates use the same master-detail navigation and support either a rich-text `BASIC` template or a structured `SIZE_TABLE` containing measurement name, method, tolerance, grade rule, pattern size/value and notes. Construction and measurement templates are available immediately after creation, remain editable and do not have publish, retire or deactivate actions. Administrators can permanently delete an unwanted template after explicit confirmation; deletion is type-restricted, origin-protected and audited. Image uploads are limited to 5 MB and Word imports to 10 MB. Template type, code and version are unique; content is stored as structured JSON. Other versioned template types retain the `DRAFT` to `PUBLISHED` to `RETIRED` lifecycle. Administrator mutations are origin-protected, audited and protected against duplicate submission.
