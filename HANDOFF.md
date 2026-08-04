# Hello Molly ERP — Development Handoff

Last updated: 4 August 2026 (Australia/Sydney)

## 1. Read this first

This is the production implementation repository, separate from the ERP crawler, screenshots, videos and prototype work.

Before changing code, read these files completely:

1. `AGENTS.md`
2. `HANDOFF.md`
3. `README.md`
4. `package.json`
5. `prisma/schema.prisma`
6. `src/config/navigation.ts`

Run `git status --short` before editing. Existing modifications belong to the user. Do not reset, discard, overwrite or reformat unrelated work. At the time this handoff was generated, the branch was `main`, the latest commit was `56d3bfe master data wip`, and the worktree was clean before adding this file.

## 2. Product objective

Build a bilingual fashion ERP for Hello Molly teams in Australia and China. The system is intended to reproduce and improve the observed reference ERP while using a maintainable modern architecture. The seven-stage product development chain will eventually connect planning, style design, sampling, material development, bulk production, inventory, purchasing and finance through stable business identifiers such as `styleId`.

The current implementation focus has been authentication, the application shell and Master Data. AWS deployment is intentionally deferred until local product development is further advanced.

## 3. Approved technology stack

- Next.js 16.3 App Router as the full-stack framework
- React 19.2 and TypeScript
- Tailwind CSS 4
- Prisma 7 with PostgreSQL 17
- JWT credential authentication with Argon2 and revocable database sessions
- TanStack Table
- BullMQ 6 with Redis 8
- MinIO locally for S3-compatible object storage
- Mailpit for local email testing
- Zod validation
- Vitest, ESLint and Prettier
- Docker Compose for local infrastructure

Do not introduce NestJS, tRPC or OIDC unless the user explicitly revisits those decisions. JWT is the current authentication choice. Prisma, TanStack Table and BullMQ are approved.

## 4. Local development

Requirements: Node.js 24+, npm 11+ and Docker Desktop.

```bash
cp .env.example .env
npm install
npm run infra:up
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Useful endpoints:

- App: `http://localhost:3000`
- English workspace: `http://localhost:3000/en-AU/workspace`
- Chinese workspace: `http://localhost:3000/zh-CN/workspace`
- Health: `http://localhost:3000/api/health`
- MinIO console: `http://localhost:9001`
- Mailpit: `http://localhost:18025`

Run the worker separately when queue processing is needed:

```bash
npm run worker
```

Set `SEED_ADMIN_PASSWORD` locally and use the seeded `admin@hellomolly.com.au` account. Never put credentials or `.env` contents in documentation, commits, logs or chat responses.

Next.js hot reloads source changes during `npm run dev`; Docker does not need restarting for normal application code edits. Restart affected containers only for infrastructure configuration changes.

## 5. Required verification

After each implementation task, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run `npm run format` or targeted Prettier formatting before final verification. Do not claim completion if any check fails.

Latest verified baseline:

- ESLint: passed
- TypeScript: passed
- Vitest: 14 test files, 46 tests passed
- Next.js production build: passed

## 6. Current database migrations

Applied migration history:

- `20260804003110_initial_identity`
- `20260804011003_password_reset`
- `20260804014655_customer_master`
- `20260804020133_supplier_master`
- `20260804021814_factory_master`
- `20260804022405_warehouse_master`
- `20260804022934_reference_data_master`
- `20260804023505_template_master`
- `20260804032313_split_reference_modules`
- `20260804032939_delivery_addresses_cashier_accounts`

The most recent UI simplifications require no new migration. Use `npm run db:deploy` for existing migrations. Never run destructive migration/reset commands without explicit user approval.

## 7. Completed platform foundations

- Docker-based PostgreSQL, Redis, MinIO and Mailpit development infrastructure
- Prisma schema and migration workflow
- JWT login, access/refresh rotation, revocable sessions and password reset
- Role and permission administration foundations
- Trusted-origin checks on mutations
- Immutable audit events for important master-data mutations
- Locale-routed `en-AU` and `zh-CN` workspaces
- Fifteen top-level ERP navigation modules
- Loading states and duplicate-submit protection on implemented forms
- Hello Molly visual system using black typography, pink crown/accent, blush surfaces and warm neutral backgrounds
- Responsive application shell with sticky header, active navigation states and mobile drawer

## 8. Master Data status

Master Data Phase 1 is complete and production-build verified.

### Full master records

- Customers: create, search, pagination, edit, safe deactivate/reactivate and audit history
- Factories: create, search, edit, capability tags, status lifecycle and audit history
- Suppliers: create, search, edit, certifications, status lifecycle and audit history
- Warehouses: create, edit, ownership, locations, safe deactivate/reactivate and audit history

Core records use `INACTIVE` as safe deletion so historical business references are preserved.

### Simple one-field lists

The user explicitly requested the following modules to behave like simple name/address lists:

- Delivery Addresses: address-only add/edit/delete; no visible sequence field
- Settlement Methods: name-only add/delete
- Invoice Types: name-only add/delete
- Sample Types: name-only add/delete
- Expense Types: name-only add/delete
- Size Sorting: name-only add/delete
- Sales Channels: name-only add/delete
- Cashier Accounts: name-only add/delete

Reference-list pages generate technical unique codes internally. Their delete action safely deactivates the record and hides it from the active list, preserving future historical references.

Cashier Accounts still have required account fields in the existing Prisma model. The simplified UI generates an internal unique account number and defaults the hidden currency to `AUD`. Existing detailed account data remains in the database but is intentionally not displayed by the simplified page. Revisit the data model only if the user later needs real banking details.

### Template masters

- Construction Requirement Templates: master-detail layout, rich text, tables, links, images, `.docx` import, preview, print, fullscreen, edit and confirmed delete
- Measurement Chart Templates: separate `BASIC` rich-text and `SIZE_TABLE` structured table modes, master-detail layout, edit and confirmed delete

Templates are available immediately after creation and do not use an active/inactive lifecycle.

### Unit placement

- Finished Goods Units are under Style Design
- Material Units are under Material Development

These retain richer coded reference maintenance because unit category, symbol and decimal precision can be operationally relevant.

## 9. Important implementation conventions

- Prefer Server Components for reads and Client Components only for interactive state.
- Next.js 16 route `params`, `searchParams`, `cookies()` and `headers()` are asynchronous.
- Read relevant local Next.js docs under `node_modules/next/dist/docs/` before changing framework-level behavior, as required by `AGENTS.md`.
- Authenticate every mutation and enforce trusted-origin validation.
- Validate API input with Zod.
- Record audit events for master-data mutations.
- Disable submitting controls while pending and prevent duplicate requests.
- Use confirmed physical deletion only for self-contained records.
- Use safe deactivate/soft-delete semantics for records that may be referenced by business transactions.
- Maintain both Chinese and English user-facing copy.
- Keep Hello Molly pink for primary actions, focus and active states; do not turn dense operational tables into large pink surfaces.
- Preserve unrelated user changes in the worktree.

## 10. Key code locations

- App shell: `src/components/shell/app-shell.tsx`
- Brand mark: `src/components/brand/hello-molly-mark.tsx`
- Global design tokens: `src/app/globals.css`
- Navigation: `src/config/navigation.ts`
- Authentication: `src/server/auth/`
- Customer domain: `src/server/customers/`, `src/components/customers/`
- Supplier domain: `src/server/suppliers/`, `src/components/suppliers/`
- Factory domain: `src/server/factories/`, `src/components/factories/`
- Warehouse domain: `src/server/warehouses/`, `src/components/warehouses/`
- Reference lists: `src/server/reference-data/`, `src/components/reference-data/`
- Delivery address/cashier account domain: `src/server/foundation-records/`, `src/components/foundation-records/`
- Templates: `src/server/templates/`, `src/components/templates/`
- API route handlers: `src/app/api/`
- Prisma schema: `prisma/schema.prisma`

## 11. Known limitations and deliberate deferrals

- Most non-Master-Data ERP modules are still navigation/prototype-level placeholders.
- Full end-to-end seven-stage workflow persistence is not implemented yet.
- Complete domain-wide translation dictionaries and persisted user language preference remain future work.
- Granular permissions need to expand alongside each business module.
- AWS ECS production infrastructure, China/Australia connectivity strategy, CI/CD, observability, backup and disaster recovery remain later phases.
- OIDC is deliberately deferred.
- The simplified Cashier Accounts UI is not a banking-details management screen.
- Bulk import/export, data retention rules and reference-usage checks should be added as business volume grows.

## 12. Recommended next work

Confirm the next module with the user before implementation. Based on the current sequence, the likely next domain is Merchandise Planning (`商品企划`), followed by Style Design (`款式设计`) and the seven-stage product development workflow.

For any new module:

1. Recheck existing screenshots/videos and prototype evidence.
2. Define the business entity, statuses, identifiers and relationships.
3. Add Prisma schema and a non-destructive migration.
4. Implement authenticated service functions and audited mutations.
5. Add bilingual Server Component pages and focused Client Components.
6. Add database-backed service tests.
7. Update `README.md` and this handoff/checklist.
8. Run all required verification commands.

## 13. Handoff checklist

- [x] Phase 0 local infrastructure baseline
- [x] JWT authentication and session lifecycle
- [x] Application shell and bilingual routing
- [x] Hello Molly brand UI foundation
- [x] Master Data navigation structure
- [x] Customer master
- [x] Factory master
- [x] Supplier master
- [x] Warehouse and location master
- [x] Reference-data split into original ERP modules
- [x] Delivery address list
- [x] Cashier account list
- [x] Construction requirement templates
- [x] Measurement chart templates
- [x] Current full lint/type/test/build verification
- [ ] Confirm next business module and acceptance criteria
- [ ] Implement Merchandise Planning domain
- [ ] Implement Style Design domain and stable `styleId`
- [ ] Implement the seven-stage product development workflow
- [ ] Expand inventory, purchasing, finance and reporting domains
- [ ] Complete internationalisation and granular permission coverage
- [ ] Add production CI/CD and AWS ECS deployment infrastructure

## 14. Suggested first prompt for the next assistant

```text
Please take over /Users/ryanzeng/code/hello-molly-erp.

Before changing anything, read AGENTS.md, HANDOFF.md, README.md, package.json,
prisma/schema.prisma and src/config/navigation.ts completely. Then run
git status --short and preserve all existing user changes.

Summarize the current state and tell me the next implementation step. Do not
modify code until I confirm that next task. After every approved task, update
HANDOFF.md/checklist and run lint, typecheck, tests and the production build.
```
