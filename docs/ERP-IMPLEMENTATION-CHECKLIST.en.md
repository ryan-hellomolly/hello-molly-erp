# ERP Implementation Master Checklist

> Status: Active execution tracker
> Version: 1.4
> Date: 5 August 2026
> Related plan: [`ERP-TECHNICAL-IMPLEMENTATION-PLAN.en.md`](./ERP-TECHNICAL-IMPLEMENTATION-PLAN.en.md)
> Architecture: full-stack Next.js modular monolith, PostgreSQL, Redis, object storage and independent Workers

## 1. Checklist Rules

Checkbox meaning:

- `[ ]` — not started, in progress, blocked, or not yet evidenced.
- `[x]` — completed and supported by reviewable evidence.
- A blocked item remains unchecked and receives `BLOCKED:` plus the dependency, owner and target decision date.
- A partially completed item remains unchecked; progress belongs in its note or linked delivery ticket.
- A Gate may be checked only by its named approver after every mandatory input is accepted.

For each active item, the delivery tracker should record:

```text
ID | Status | Owner | Target date | Evidence link | Dependency/blocker | Last update
```

Update this file at least once per iteration and at every phase/release review. Do not rewrite IDs after work has started; add a replacement item and reference the superseded ID.

## 2. Current Baseline Snapshot

Current checklist count: **44 completed / 299 total items; 255 items remain open**. This is an item count for navigation, not an earned-value or schedule percentage; phase Gates determine readiness. (Recount as of 5 Aug 2026: the prior "35 completed" figure had drifted from the actual checkbox state even before this update's three new items — this snapshot is a direct count of `[x]` lines in this file.)

| Area | Current verified state | Next control point |
| --- | --- | --- |
| Evidence capture | Completed for the available reference ERP evidence | Business validation and gap decisions |
| Interactive prototype | Completed as a customer-facing concept | Formal scope and usability sign-off |
| Architecture direction | Full-stack Next.js decision documented | ADR approval and production spike |
| Technology baseline | Prisma, TanStack Table, Redis/BullMQ and JWT/session authentication approved | Implement and validate critical patterns |
| Implementation planning | English plan and Chinese/English development guides updated | Owners, budget and release baseline |
| Docker local environment | Initial isolated Compose stack implemented and verified | Complete a clean-machine onboarding test |
| ECS/Fargate | Target designed; provisioning intentionally deferred | AWS staging after local core flows are stable |
| Production ERP | Authentication, RBAC foundations, seven Master Data domains and Style Design Phase 1 implemented and passing lint/typecheck/tests/build outside the formal Phase 0/1 gates | Formal Phase 0 exit, Phase 1 governance sign-off and retroactive Gate evidence review |

### 2.1 Iteration Status Board

Use this small board for items that are actively moving; leave the complete backlog in the sections below.

| ID | State | Owner | Target | Evidence / blocker | Last update |
| --- | --- | --- | --- | --- | --- |
| `BASE-GATE` | Pending stakeholder review | Unassigned | TBD | Formal prototype scope acceptance required | 4 Aug 2026 |
| `NEXT-001` | Not started | Unassigned | TBD | Assign Phase 0 owners and dates | 4 Aug 2026 |
| `NEXT-002` | Not started | Unassigned | TBD | Schedule Release 1 scope workshop | 4 Aug 2026 |

## 3. Completed Discovery and Prototype Assets

- [x] `BASE-001` Collect automated menu, page, control and API evidence under `output/`.
- [x] `BASE-002` Collect available business-process recordings under `videos/`.
- [x] `BASE-003` Record the fifteen top-level ERP navigation modules and deeper menu levels.
- [x] `BASE-004` Produce the seven-stage product-development concept and Style ID lifecycle narrative.
- [x] `BASE-005` Produce a customer-facing interactive ERP prototype.
- [x] `BASE-006` Expand the prototype to full ERP navigation and representative business workspaces.
- [x] `BASE-007` Add differentiated prototype experiences for master data, planning, style, material, sampling, production, procurement, inventory, finance, reports and administration.
- [x] `BASE-008` Add global Chinese/English switching to the prototype.
- [x] `BASE-009` Update the prototype architecture page to full-stack Next.js plus independent Workers.
- [x] `BASE-010` Generate a self-contained shareable HTML prototype under `prototype/share/`.
- [x] `BASE-011` Document the full-stack Next.js architecture decision in the technical plan and guides.
- [x] `BASE-012` Add Docker local-development and ECS/Fargate deployment guidance to the implementation plan.
- [ ] `BASE-GATE` Customer and internal stakeholders formally accept the prototype as requirements evidence, not a final UI specification. `[Approvers: Product Sponsor + Engineering Lead]`

## 4. Programme Mobilisation and Governance — Phase 0

### 4.1 Ownership and Controls

- [ ] `P0-GOV-001` Name the Product Sponsor with budget and scope authority. `[Owner: ___]`
- [ ] `P0-GOV-002` Name the Product Manager and one empowered owner for every active business domain. `[Owner: ___]`
- [ ] `P0-GOV-003` Name Engineering, Architecture, Data, Security, QA, UX, Platform and Change leads. `[Owner: ___]`
- [ ] `P0-GOV-004` Establish the decision log, ADR template, RAID log and change-control process. `[Owner: ___]`
- [ ] `P0-GOV-005` Establish iteration cadence, demos, dependency review and steering review. `[Owner: ___]`
- [ ] `P0-GOV-006` Define Definition of Ready, Definition of Done and evidence requirements. `[Owner: ___]`
- [ ] `P0-GOV-007` Approve repository access, branch protection, review rules and CODEOWNERS. `[Owner: ___]`
- [ ] `P0-GOV-008` Approve environment, data-classification and production-access policies. `[Owner: ___]`

### 4.2 Scope and Process Baseline

- [ ] `P0-SCP-001` Confirm terminology in Chinese and English. `[Owner: Business Analysis]`
- [ ] `P0-SCP-002` Validate all fifteen top-level modules against actual Hello Molly scope. `[Owner: Product]`
- [ ] `P0-SCP-003` Validate the seven-stage product-development flow and stage owners. `[Owner: Product]`
- [ ] `P0-SCP-004` Map Fitting Template to sampling execution and approve the target workflow. `[Owner: Product Development]`
- [ ] `P0-SCP-005` Separate QC Template, production QC and inbound QC scope. `[Owner: Quality]`
- [ ] `P0-SCP-006` Classify every capability as Must, Should, Could or Not Now. `[Owner: Product]`
- [ ] `P0-SCP-007` Define Release 1 process boundaries and explicit non-goals. `[Owner: Product Sponsor]`
- [ ] `P0-SCP-008` Define named roles, approval responsibilities and segregation-of-duty conflicts. `[Owner: Product + Finance]`
- [ ] `P0-SCP-009` Define reports, KPIs, formulas, dimensions, cut-off times and data owners. `[Owner: Domain Owners]`
- [ ] `P0-SCP-010` Convert priority workflows into acceptance scenarios and exception paths. `[Owner: BA + QA]`

### 4.3 Data and Integration Discovery

- [ ] `P0-DAT-001` Inventory all spreadsheets, exports, file stores and legacy data sources. `[Owner: Data Lead]`
- [ ] `P0-DAT-002` Profile at least three representative datasets for duplicates, completeness and invalid references. `[Owner: Data Lead]`
- [ ] `P0-DAT-003` Approve canonical names, identifiers and ownership for core entities. `[Owner: Data Governance]`
- [ ] `P0-DAT-004` Approve `styleId` as lifecycle spine and define transaction-document relationships. `[Owner: Architecture + Product]`
- [ ] `P0-DAT-005` Define retention, deletion, archive and legal-hold rules. `[Owner: Legal/Security]`
- [ ] `P0-DAT-006` Define China/Australia timezone, currency, tax, unit and localisation rules. `[Owner: Finance + Operations]`
- [ ] `P0-INT-001` Inventory identity, email, SMS, Dropbox, accounting, logistics and platform integrations. `[Owner: Integration Lead]`
- [ ] `P0-INT-002` Record API ownership, credentials model, rate limits, sandbox availability and failure behaviour. `[Owner: Integration Lead]`
- [ ] `P0-INT-003` Decide which integrations are Release 1, later releases or excluded. `[Owner: Product]`

### 4.4 Architecture and Delivery Spikes

- [ ] `P0-ARC-001` Approve the full-stack Next.js modular-monolith ADR. `[Approver: Architecture Review]`
- [x] `P0-ARC-002` Select Prisma as the initial ORM; retain a spike for transaction, migration and complex-query patterns. `[Decision: 4 Aug 2026]`
- [ ] `P0-ARC-003` Select the UI component strategy; TanStack Table is tracked separately as approved. `[Owner: UX + Engineering]`
- [x] `P0-ARC-004` Approve initial credential + JWT + revocable-session authentication; defer OIDC provider integration behind an adapter. `[Decision: 4 Aug 2026]`
- [x] `P0-ARC-005` Select Redis + BullMQ for initial asynchronous jobs. `[Decision: 4 Aug 2026]`
- [ ] `P0-ARC-006` Validate file upload, object metadata, private download and antivirus workflow. `[Owner: Platform]`
- [ ] `P0-ARC-007` Validate a high-density ERP table with realistic data volume. `[Owner: Engineering]`
- [ ] `P0-ARC-008` Validate bilingual rendering, fonts, exports and Chinese office connectivity. `[Owner: UX + Platform]`
- [x] `P0-ARC-009` Build and verify a multi-stage production Docker image for Next.js standalone output. `[Evidence: hello-molly-erp/Dockerfile; local image hello-molly-erp:phase0, 4 Aug 2026]`
- [ ] `P0-ARC-010` Document future ECS/Fargate constraints without provisioning AWS resources. `[Owner: Platform]`
- [ ] `P0-ARC-011` Review the local Docker design for future Web, Worker and one-shot Migration task compatibility. `[Owner: Platform]`
- [ ] `P0-ARC-012` Produce an initial AWS cost model and capacity assumptions. `[Owner: Platform + Finance]`
- [x] `P0-ARC-013` Select TanStack Table for the initial ERP table abstraction. `[Decision: 4 Aug 2026]`

- [ ] `P0-GATE` Phase 0 exit approved: signed Release 1 scope, owners, data assessment, ADRs, estimate, risks, migration approach and pilot plan. `[Approvers: Product Sponsor + Engineering Lead + Data Lead + Security Lead]`

## 5. Engineering Foundation — Phase 1

### 5.1 Repository and Quality Controls

- [ ] `P1-ENG-001` Create the production monorepo with `apps/erp`, `apps/worker` and approved packages. `[Owner: Engineering]`
- [ ] `P1-ENG-002` Configure TypeScript strict mode, linting, formatting and import-boundary enforcement. `[Owner: Engineering]`
- [ ] `P1-ENG-003` Prevent server-only domain/database packages from entering Client Components. `[Owner: Engineering]`
- [ ] `P1-ENG-004` Configure unit, integration, contract and Playwright test projects. `[Owner: QA]`
- [ ] `P1-ENG-005` Configure dependency, secret, licence and container-image scanning. `[Owner: Security]`
- [ ] `P1-ENG-006` Configure protected CI checks and immutable build artefacts. `[Owner: Platform]`
- [ ] `P1-ENG-007` Generate build/release metadata and expose it through diagnostics. `[Owner: Platform]`

### 5.2 Docker Local Development

- [ ] `P1-DKR-001` Add production `Dockerfile` for the Next.js standalone application. `[Owner: Platform]`
- [ ] `P1-DKR-002` Add Worker Dockerfile or approved alternate target. `[Owner: Platform]`
- [ ] `P1-DKR-003` Add `.dockerignore` and confirm secrets/build caches are excluded. `[Owner: Security]`
- [ ] `P1-DKR-004` Add `compose.yaml` for PostgreSQL, Redis, object storage, mail, ERP, Worker and Migration. `[Owner: Platform]`
- [ ] `P1-DKR-005` Add health checks and dependency readiness conditions. `[Owner: Platform]`
- [ ] `P1-DKR-006` Add `.env.example` with no real credentials. `[Owner: Engineering]`
- [ ] `P1-DKR-007` Add deterministic seed data for one complete Style lifecycle. `[Owner: Data + QA]`
- [ ] `P1-DKR-008` Document start, stop, logs, migration, reset and test commands. `[Owner: Engineering]`
- [ ] `P1-DKR-009` Verify onboarding from a clean macOS Apple Silicon machine. `[Owner: QA]`
- [ ] `P1-DKR-010` Verify onboarding from Windows/WSL or the agreed Windows setup. `[Owner: QA]`
- [ ] `P1-DKR-011` Interrupt a Worker job and verify safe retry/idempotency. `[Owner: QA]`
- [ ] `P1-DKR-012` Confirm local development does not require production data or secrets. `[Owner: Security]`

### 5.3 Deployment Portability Without AWS Provisioning

- [ ] `P1-DEP-001` Run Web and Worker as separate stateless local containers. `[Owner: Platform]`
- [ ] `P1-DEP-002` Keep files, sessions, locks, queues and job state outside container memory/filesystem. `[Owner: Engineering]`
- [ ] `P1-DEP-003` Implement `/health/live` and bounded `/health/ready` endpoints. `[Owner: Engineering]`
- [ ] `P1-DEP-004` Handle `SIGTERM` and verify graceful Web/Worker shutdown locally. `[Owner: Platform + QA]`
- [ ] `P1-DEP-005` Execute schema migration as one explicit one-shot command, never from every replica startup. `[Owner: Data/Platform]`
- [ ] `P1-DEP-006` Emit structured logs to stdout with release and Trace IDs. `[Owner: Platform]`

### 5.4 Platform Capabilities

- [ ] `P1-PLT-001` Implement tenant, organisation, department, position and user model. `[Owner: IAM Team]`
- [x] `P1-PLT-002` Implement credential login, short-lived JWT access, revocable session, refresh and logout flows. `[Evidence: hello-molly-erp/src/server/auth and src/app/actions/auth.ts; verified 4 Aug 2026]`
- [ ] `P1-PLT-003` Implement RBAC plus organisation, department, warehouse and brand data scopes. `[Owner: IAM Team]`
- [ ] `P1-PLT-004` Implement field/action permissions and segregation-of-duty controls. `[Owner: IAM + Finance]`
- [ ] `P1-PLT-005` Implement immutable audit events with actor, object, before/after and Trace ID. `[Owner: Platform]`
- [ ] `P1-PLT-006` Implement object upload, scanning, metadata, private retrieval and retention. `[Owner: Files Team]`
- [ ] `P1-PLT-007` Implement document numbering, dictionaries, locale, timezone and currency primitives. `[Owner: Platform]`
- [ ] `P1-PLT-008` Implement workflow definition, instance, task, approval and escalation primitives. `[Owner: Workflow Team]`
- [ ] `P1-PLT-009` Implement notification preferences, inbox and delivery-outbox foundations. `[Owner: Platform]`
- [ ] `P1-PLT-010` Implement job creation, progress, retry, cancellation and failure diagnostics. `[Owner: Worker Team]`
- [ ] `P1-PLT-011` Implement feature flags and controlled configuration changes. `[Owner: Platform]`
- [ ] `P1-PLT-012` Implement structured errors, correlation IDs and security-safe logging. `[Owner: Platform]`

### 5.5 Authentication Implementation

- [x] `P1-AUTH-001` Define `AuthService`, `SessionUser` and future OIDC adapter boundaries. `[Evidence: contracts.ts, auth-service.ts and AuthService tests; verified 4 Aug 2026]`
- [x] `P1-AUTH-002` Implement Argon2id password hashing and password policy. `[Evidence: password-policy.ts, password-reset.ts and tests; verified 4 Aug 2026]`
- [x] `P1-AUTH-003` Implement short-lived JWT access tokens using `jose`. `[Evidence: hello-molly-erp/src/server/auth/tokens.ts; tests passed 4 Aug 2026]`
- [x] `P1-AUTH-004` Store access/refresh credentials only in appropriately scoped HttpOnly cookies. `[Evidence: hello-molly-erp/src/server/auth/session.ts; verified 4 Aug 2026]`
- [x] `P1-AUTH-005` Implement durable session and hashed rotating refresh-token records. `[Evidence: Session model and refresh route; verified 4 Aug 2026]`
- [x] `P1-AUTH-006` Implement logout, forced logout, password-reset and user-disable revocation. `[Evidence: password-reset and session APIs plus admin user-status route; verified 4 Aug 2026]`
- [x] `P1-AUTH-007` Invalidate sessions after relevant role/permission changes using authentication versioning or explicit revocation. `[Evidence: access-management.ts and admin role/permission routes; verified 4 Aug 2026]`
- [x] `P1-AUTH-008` Implement login, refresh and password-reset rate limits and replay detection. `[Evidence: security.ts, refresh and password-reset routes; verified 4 Aug 2026]`
- [x] `P1-AUTH-009` Implement CSRF/origin protections for cookie-authenticated mutations. `[Evidence: hello-molly-erp/src/server/auth/security.ts and origin tests; verified 4 Aug 2026]`
- [x] `P1-AUTH-010` Test token expiry, refresh rotation, theft/replay, revocation and access isolation. `[Evidence: auth.integration.test.ts and token tests, 11/11 passing 4 Aug 2026; current single-organisation deployment uses cross-user ownership isolation, with tenant-specific tests required if multi-tenancy is introduced]`

### 5.6 Master Data

- [x] `P1-MD-001` Deliver customer master and duplicate rules. `[Evidence: hello-molly-erp customer model, bilingual TanStack list, create/edit/status APIs, administrator edit/deactivate UI, normalized duplicate protection and immutable audit history; 25/25 tests, lint and production build passed 4 Aug 2026]` `[Owner: Master Data]`
- [x] `P1-MD-002` Deliver supplier master, certification and status rules. `[Evidence: hello-molly-erp Supplier and SupplierCertification models, bilingual list/create/manage UI, active/suspended/inactive workflow, derived valid/expiring/expired certification rules, protected APIs, duplicate controls and immutable audit history; supplier service 97.82% line coverage, 29/29 total tests, lint and production build passed 4 Aug 2026]` `[Owner: Master Data]`
- [x] `P1-MD-003` Deliver factory master, contacts, capabilities and status rules. `[Evidence: hello-molly-erp Factory model and migration, bilingual search/create/manage UI, contact and normalized capability maintenance, active/on-hold/inactive workflow, protected APIs, duplicate controls, immutable audit history and loading/double-submit protection; factory service 94.73% line coverage, 33/33 total tests, lint and production build passed 4 Aug 2026]` `[Owner: Master Data]`
- [x] `P1-MD-004` Deliver warehouses, locations and ownership rules. `[Evidence: hello-molly-erp Warehouse and WarehouseLocation models and migration, explicit Hello Molly/3PL/factory/supplier ownership with external-owner validation, globally unique warehouses and warehouse-scoped location codes, bilingual list/create/manage UI, status and audit workflows, protected APIs and loading/double-submit protection; warehouse service 91.66% line coverage, 36/36 total tests, lint and production build passed 4 Aug 2026]` `[Owner: Inventory]`
- [x] `P1-MD-005` Deliver sizes, size sorting, units, currencies and terms. `[Evidence: hello-molly-erp typed ReferenceValue model and migration for SIZE/UNIT/CURRENCY/TRADE_TERM, governed sort order, bilingual labels, unit category/precision and three-letter currency validation, unique type-scoped codes, bilingual administrator workbench, activate/deactivate audit workflows, protected APIs and loading/double-submit protection; reference-data service 100% line coverage, 39/39 total tests, lint and production build passed 4 Aug 2026]` `[Owner: Master Data]`
- [x] `P1-MD-006` Deliver sample, measurement and construction template masters. `[Evidence: hello-molly-erp versioned TemplateMaster model and migration for SAMPLE/MEASUREMENT/CONSTRUCTION, unique type/code/version identity, structured JSON content, irreversible DRAFT→PUBLISHED→RETIRED workflow, bilingual administrator workbench, audit events, protected APIs and loading/double-submit protection; template service 100% line coverage, 41/41 total tests, lint and production build passed 4 Aug 2026]` `[Owner: Product Development]` `[Extended 5 Aug 2026: see P2-STY-007 for the added PROCESS template type]`
- [ ] `P1-MD-007` Deliver bilingual validation messages, imports and exports. `[Owner: UX + Engineering]`
- [ ] `P1-MD-008` Validate migration, reconciliation and audit evidence for master data. `[Owner: Data + QA]`

- [ ] `P1-GATE` Phase 1 exit approved: reproducible local environment, deployment-portable containers, security controls, local recovery test, platform primitives and governed master data. `[Approvers: Product + Engineering + Data + Security + Operations]`

## 6. Product Development Core — Phase 2

- [ ] `P2-PLN-001` Implement seasons, collections, briefs, line plans and milestones. `[Owner: Merchandise Planning]`
- [ ] `P2-PLN-002` Implement target cost, budget and assortment controls. `[Owner: Merchandise Planning + Finance]`
- [ ] `P2-STY-001` Implement Style identity, status, owner and lifecycle timeline. `[Owner: Style Team]`
- [ ] `P2-STY-002` Implement colour, size and SKU matrix. `[Owner: Style Team]`
- [ ] `P2-STY-003` Implement immutable Tech Pack versions and publication. `[Owner: Style Team]`
- [ ] `P2-STY-004` Implement measurements, tolerances, grading and construction details. `[Owner: Style Team]`
- [x] `P2-STY-005` Deliver Style Design Phase 1 master: identity, five-state lifecycle and colourway list, with `styleId` as the stable foreign-key spine for later product-development stages. `[Evidence: hello-molly-erp Style/StyleColorway models and migrations; service layer src/server/styles/service.ts; protected API routes src/app/api/styles/**; dedicated create page /{locale}/workspace/style-design/styles/new plus detail/edit page; bilingual list; DRAFT→IN_DEVELOPMENT→SAMPLE_APPROVED→ACTIVE lifecycle with DISCONTINUED reachable from any state and reactivatable, matching the Customer/Warehouse soft-delete precedent; colourway add and status toggle; audit events and trusted-origin protection; styles service 86.59% line coverage, 5/5 tests, part of 16 files/56 total tests, lint and production build passed 5 Aug 2026. Explicitly deferred: an assignable owner/merchandiser field, a full lifecycle-timeline view beyond the shared audit log, and the size/SKU matrix (tracked separately against P2-STY-002, still open)]` `[Owner: Style Team]`
- [x] `P2-STY-006` Deliver eight Style Design reference-data lists prerequisite to the Style master, including an arbitrary-depth Style Type tree matching the reference ERP's own hierarchy. `[Evidence: hello-molly-erp ReferenceType extended with STYLE_TYPE/SEASON/YEAR/STAGE/PROCESSING_TYPE/WASH_TYPE/FABRIC_TRIM_TYPE/EXECUTION_STANDARD; self-referencing parentId hierarchy on ReferenceValue (migration ..._style_type_hierarchy) with HAS_ACTIVE_CHILDREN and cross-type-parent guards; dedicated StyleTypeManager tree UI (src/components/reference-data/style-type-manager.tsx) with 新建/添加子级/编辑/删除 actions; the other seven lists reuse the existing simple one-name add/delete interface; Style's 类型 picker renders the tree indented via a shared depth-first buildReferenceTree helper (src/components/reference-data/reference-tree.ts, 3/3 unit tests); Finished Goods Units was also switched from the richer coded interface to the same simple one-name interface for consistency with Processing Type and its siblings; reference-data service 90.38% line coverage, 5/5 tests, lint and production build passed 5 Aug 2026]` `[Owner: Style Team + Master Data]`
- [x] `P2-STY-007` Extend template masters with a PROCESS template type for Style Design process-step templates. `[Evidence: hello-molly-erp TemplateType.PROCESS added (migration ..._add_process_template_type), reusing the existing TemplateMaster/createTemplate infrastructure with no new model, consistent with the Construction/Measurement "available immediately, no publish/retire" precedent; master-detail ProcessTemplateManager (src/components/templates/process-template-manager.tsx) with reorderable (up/down) process-step rows — name, stage linked to the Processing Type reference list, work seconds, unit price, temporary unit price, and open-pricing/countable/key-process toggles editable inline on the display page as well as in the edit dialog; templates service 92.13% line coverage, 5/5 tests, lint and production build passed 5 Aug 2026. Deliberately deferred: Excel import/export shown in the reference ERP screenshot, pending a spreadsheet-library decision]` `[Owner: Style Team]`
- [ ] `P2-MAT-001` Implement fabric, trim, packaging and supplier-source masters. `[Owner: Material Team]`
- [ ] `P2-MAT-002` Implement swatches, lab dips, quotes, MOQ and material tests. `[Owner: Material Team]`
- [ ] `P2-BOM-001` Implement versioned BOM, consumption and substitution approval. `[Owner: Style + Material]`
- [ ] `P2-SMP-001` Implement sample order, type, round, factory, owner and due date. `[Owner: Sampling]`
- [ ] `P2-SMP-002` Implement sample follow-up templates, tasks, reminders and exceptions. `[Owner: Sampling]`
- [ ] `P2-SMP-003` Implement sample evidence, cost and approval. `[Owner: Sampling]`
- [ ] `P2-IMP-001` Implement spreadsheet/file import to reviewable draft. `[Owner: Import Team]`
- [ ] `P2-IMP-002` Record source, field confidence, reviewer and final provenance. `[Owner: Import Team]`
- [ ] `P2-IMP-003` Verify repeated import is idempotent. `[Owner: QA]`
- [ ] `P2-DASH-001` Implement role-based tasks, approvals, overdue work and exception queues. `[Owner: Application Team]`
- [ ] `P2-E2E-001` Complete one style from brief through published Tech Pack and sample request. `[Owner: QA]`
- [ ] `P2-GATE` Phase 2 exit approved: connected product-development core, immutable versions, traceability, permissions, audit and tested import. `[Approvers: Product Development + Engineering + QA]`

## 7. Fitting, PP and Quality — Phase 3

- [ ] `P3-FIT-001` Approve Fitting template structure, body areas, measurements and decision vocabulary. `[Owner: Fit/QC]`
- [ ] `P3-FIT-002` Implement Fitting template versioning and publication. `[Owner: Fit Team]`
- [ ] `P3-FIT-003` Implement Fitting sessions for first, second, size-set/SMS and PP rounds. `[Owner: Fit Team]`
- [ ] `P3-FIT-004` Implement actual-versus-spec measurements and tolerance results. `[Owner: Fit Team]`
- [ ] `P3-FIT-005` Implement image annotations, comments, actions, owner and due date. `[Owner: Fit Team]`
- [ ] `P3-FIT-006` Implement approve, approve-with-comments, revise and reject decisions. `[Owner: Fit Team]`
- [ ] `P3-FIT-007` Prevent approval while mandatory issues remain unresolved. `[Owner: Fit Team]`
- [ ] `P3-QC-001` Approve separate QC templates for production and inbound inspection. `[Owner: Quality]`
- [ ] `P3-QC-002` Implement template categories, checklist items, defect types and severity. `[Owner: Quality]`
- [ ] `P3-QC-003` Implement AQL or approved sampling rules. `[Owner: Quality]`
- [ ] `P3-QC-004` Implement inspection evidence, responsible party, CAPA and reinspection. `[Owner: Quality]`
- [ ] `P3-QC-005` Implement immutable final inspection and audit history. `[Owner: Quality]`
- [ ] `P3-QC-006` Implement release block and stock hold on failed quality gates. `[Owner: Quality + Inventory]`
- [ ] `P3-E2E-001` Complete sample, Fitting decision, PP approval, failed QC, corrective action and release. `[Owner: QA]`
- [ ] `P3-GATE` Release 1 gate approved: pilot users complete the product-development lifecycle with no critical control failure. `[Approvers: Product Sponsor + Quality + Engineering + QA]`

## 8. Supply Chain, Production and Inventory — Phase 4

- [ ] `P4-PRC-001` Implement requisition, purchase order, approval, acknowledgement and due date. `[Owner: Procurement]`
- [ ] `P4-PRC-002` Implement receipt, variance, return and supplier-performance evidence. `[Owner: Procurement]`
- [ ] `P4-PRD-001` Implement customer/bulk order and production order. `[Owner: Production]`
- [ ] `P4-PRD-002` Implement factory contract, production milestones and WIP status. `[Owner: Production]`
- [ ] `P4-PRD-003` Implement packing, shipment and actual-cost evidence. `[Owner: Production]`
- [ ] `P4-INV-001` Implement immutable inventory movement ledger. `[Owner: Inventory]`
- [ ] `P4-INV-002` Implement receipt, issue, transfer, adjustment, count and reservation. `[Owner: Inventory]`
- [ ] `P4-INV-003` Implement material lot/dye-lot and warehouse/location traceability. `[Owner: Inventory]`
- [ ] `P4-INV-004` Implement WIP lot and operation-movement traceability. `[Owner: Inventory]`
- [ ] `P4-INV-005` Implement finished-goods SKU stock, allocation, QC hold and shipment. `[Owner: Inventory]`
- [ ] `P4-INV-006` Implement rebuildable on-hand, reserved, available, in-transit and QC-hold balances. `[Owner: Inventory]`
- [ ] `P4-CON-001` Validate transactional locking, concurrency, idempotency and reversal behaviour. `[Owner: Engineering + QA]`
- [ ] `P4-E2E-001` Trace material demand through PO, receipt, issue, production, finished goods and shipment. `[Owner: QA]`
- [ ] `P4-GATE` Release 2 gate approved: supply-chain and inventory reconciliation meets agreed accuracy and traceability thresholds. `[Approvers: Operations + Finance + Engineering + QA]`

## 9. Finance, Reporting and Integrations — Phase 5

- [ ] `P5-FIN-001` Approve finance scope, accounting boundary and integration ownership. `[Owner: Finance]`
- [ ] `P5-FIN-002` Implement advances, receivables, payables, receipts and payments. `[Owner: Finance]`
- [ ] `P5-FIN-003` Implement reconciliation, invoices, adjustments and settlement status. `[Owner: Finance]`
- [ ] `P5-FIN-004` Implement costing and operational-to-financial traceability. `[Owner: Finance]`
- [ ] `P5-FIN-005` Implement segregation of duties and sensitive-data masking. `[Owner: Finance + Security]`
- [ ] `P5-RPT-001` Approve governed KPI definitions and ownership. `[Owner: Reporting Governance]`
- [ ] `P5-RPT-002` Implement operational dashboards and drill-through. `[Owner: Reporting]`
- [ ] `P5-RPT-003` Implement asynchronous large reports, subscriptions and access control. `[Owner: Reporting]`
- [ ] `P5-INT-001` Implement signed, replay-protected and idempotent webhooks. `[Owner: Integration]`
- [ ] `P5-INT-002` Implement retry, rate-limit, reconciliation and dead-letter operations. `[Owner: Integration]`
- [ ] `P5-INT-003` Complete contract tests with each Release 3 integration. `[Owner: Integration + QA]`
- [ ] `P5-E2E-001` Trace an operational document into reconciliation, payment and reporting. `[Owner: QA + Finance]`
- [ ] `P5-GATE` Release 3 gate approved: finance control totals, report definitions and integration reconciliation are signed off. `[Approvers: Finance + Operations + Engineering + QA]`

## 10. Enterprise Rollout — Phase 6

### 10.1 Deferred AWS Staging and Production Deployment

- [ ] `AWS-001` Confirm business readiness before incurring and operating AWS environments. `[Owner: Product Sponsor + Technology]`
- [ ] `AWS-002` Select CDK, Terraform or CloudFormation and approve module ownership. `[Owner: Platform]`
- [ ] `AWS-003` Establish AWS account/environment separation and break-glass process. `[Owner: Security]`
- [ ] `AWS-004` Create multi-AZ VPC, public ALB subnets and private application/data subnets. `[Owner: Platform]`
- [ ] `AWS-005` Decide NAT Gateway versus VPC endpoint strategy with cost estimate. `[Owner: Platform]`
- [ ] `AWS-006` Create ECR repositories, lifecycle, encryption and scanning. `[Owner: Platform]`
- [ ] `AWS-007` Create staging RDS PostgreSQL with backup and restore settings. `[Owner: Data/Platform]`
- [ ] `AWS-008` Create staging ElastiCache and private S3 buckets. `[Owner: Platform]`
- [ ] `AWS-009` Create Secrets Manager entries and rotation ownership. `[Owner: Security]`
- [ ] `AWS-010` Create separate ECS execution and application task roles. `[Owner: Security]`
- [ ] `AWS-011` Create Web, Worker and Migration task definitions. `[Owner: Platform]`
- [ ] `AWS-012` Create ALB, TLS certificate, target group and health checks. `[Owner: Platform]`
- [ ] `AWS-013` Create ECS Web and Worker services with separate scaling policies. `[Owner: Platform]`
- [ ] `AWS-014` Enable deployment circuit breaker and EventBridge failure notification. `[Owner: Platform]`
- [ ] `AWS-015` Configure CloudWatch logs, metrics, alarms and retention. `[Owner: Platform]`
- [ ] `AWS-016` Configure CI/CD OIDC, build-once promotion and deployment by image digest. `[Owner: Platform]`
- [ ] `AWS-017` Run database migration as a one-off ECS task before service deployment. `[Owner: Data/Platform]`
- [ ] `AWS-018` Verify ECS steady state and critical smoke workflow in staging. `[Owner: QA]`
- [ ] `AWS-019` Test automatic application rollback and Worker rollback. `[Owner: QA + Platform]`
- [ ] `AWS-020` Test staging access from representative China and Australia office networks. `[Owner: Platform]`
- [ ] `AWS-021` Complete staging UAT, security, performance, recovery and cost review. `[Owner: Architecture Review]`
- [ ] `AWS-022` Provision the production AWS environment from approved infrastructure as code. `[Owner: Platform]`
- [ ] `AWS-023` Rehearse production migration, cutover, rollback and support communications. `[Owner: Programme Lead]`
- [ ] `AWS-024` Deploy approved image digests and complete production smoke/reconciliation checks. `[Owner: Platform + QA + Data]`
- [ ] `AWS-GATE` AWS production release approved after staging and operational-readiness evidence. `[Approvers: Product Sponsor + Technology + Security + Operations]`

### 10.2 Rollout, Migration and Adoption

- [ ] `P6-MIG-001` Approve migration mapping, cleansing owners and reconciliation thresholds. `[Owner: Data]`
- [ ] `P6-MIG-002` Complete migration rehearsal 1 and resolve findings. `[Owner: Data]`
- [ ] `P6-MIG-003` Complete migration rehearsal 2 at production-like volume. `[Owner: Data + QA]`
- [ ] `P6-PERF-001` Complete load, soak, report and queue-backlog testing. `[Owner: Performance QA]`
- [ ] `P6-SEC-001` Complete threat model, penetration test and high-risk remediation. `[Owner: Security]`
- [ ] `P6-DR-001` Restore RDS, validate S3, recover application and reconcile data. `[Owner: Platform + Data]`
- [ ] `P6-DR-002` Exercise Worker interruption, queue replay and third-party outage. `[Owner: Platform + QA]`
- [ ] `P6-OPS-001` Approve dashboards, alerts, on-call, runbooks and escalation paths. `[Owner: Operations]`
- [ ] `P6-TRN-001` Complete bilingual role-based training and support materials. `[Owner: Change Lead]`
- [ ] `P6-TRN-002` Train super users and service-desk teams. `[Owner: Change Lead]`
- [ ] `P6-PILOT-001` Execute pilot, record adoption/task success and close critical findings. `[Owner: Product]`
- [ ] `P6-CUT-001` Approve cutover plan, freeze window, rollback decision and communications. `[Owner: Programme Lead]`
- [ ] `P6-CUT-002` Execute final migration and reconciliation. `[Owner: Data]`
- [ ] `P6-CUT-003` Deploy approved image digests and run production smoke tests. `[Owner: Platform + QA]`
- [ ] `P6-CUT-004` Obtain business go/no-go decision before opening production writes. `[Owner: Product Sponsor]`
- [ ] `P6-HYP-001` Operate enhanced support and daily triage through stability exit. `[Owner: Operations]`
- [ ] `P6-GATE` Enterprise rollout accepted: stability, adoption, reconciliation, security and support thresholds met. `[Approvers: Executive Sponsor + Operations + Finance + Technology]`

## 11. Cross-cutting Definition of Done

Apply these checks to every production feature; record `N/A` with an approver when a check genuinely does not apply.

- [ ] `DOD-001` Acceptance criteria and exception paths approved.
- [ ] `DOD-002` Chinese and English terminology reviewed.
- [ ] `DOD-003` Authentication, RBAC, data scope and field/action permissions tested.
- [ ] `DOD-004` Input validation and safe error handling tested at every entry point.
- [ ] `DOD-005` Tenant isolation and direct-object-reference tests pass.
- [ ] `DOD-006` Transaction, concurrency, idempotency and retry behaviour tested where relevant.
- [ ] `DOD-007` Audit events include actor, time, object, decision and Trace ID.
- [ ] `DOD-008` Unit and module integration tests pass.
- [ ] `DOD-009` Playwright critical-path and permission tests pass.
- [ ] `DOD-010` Accessibility, keyboard and table-density requirements pass.
- [ ] `DOD-011` Performance verified using representative data volume.
- [ ] `DOD-012` Logs, metrics, traces and business diagnostics are present and privacy-safe.
- [ ] `DOD-013` Database migration is backward compatible and rehearsed.
- [ ] `DOD-014` Operational documentation, support ownership and feature flags are ready.
- [ ] `DOD-015` Product Owner and QA acceptance evidence is linked.

## 12. Chinese and English Internationalisation Checklist

### 12.1 Language Governance and Architecture

- [ ] `I18N-001` Approve supported production locales: `zh-CN` and `en-AU`. `[Owner: Product + UX]`
- [ ] `I18N-002` Approve tenant default, user preference and fallback order. `[Owner: Product]`
- [ ] `I18N-003` Name Chinese and English terminology owners and translation approvers. `[Owner: Product]`
- [ ] `I18N-004` Approve the bilingual glossary for modules, roles, statuses, actions and business documents. `[Owner: BA + Domain Owners]`
- [ ] `I18N-005` Select the Next.js-compatible i18n/message-format library. `[Owner: Engineering]`
- [x] `I18N-006` Define translation namespaces by domain rather than one global unowned file. `[Evidence: i18n/messages/shell.ts, master-data.ts and typed namespace registry; verified 4 Aug 2026]`
- [ ] `I18N-007` Define the policy for UI text, reference-data translations and user-entered content. `[Owner: Data + Product]`
- [ ] `I18N-008` Keep stored enum/status values language-neutral and stable. `[Owner: Architecture]`
- [x] `I18N-009` Define missing-key, unsupported-locale and translation-load failure behaviour. `[Evidence: typed static messages, explicit missing-key marker and unsupported-locale 404; verified 4 Aug 2026]`
- [x] `I18N-010` Record language preference in user profile and allow persistent session switching. `[Evidence: changeLocaleAction, User.locale and HttpOnly locale cookie; verified 4 Aug 2026]`

### 12.2 Interface and Business Content

- [x] `I18N-011` Translate navigation, breadcrumbs, headings and dashboard content. `[Evidence: locale-routed ERP shell, typed navigation and navigation tests; verified 4 Aug 2026]`
- [ ] `I18N-012` Translate forms, field help, placeholders, actions and confirmation dialogs. `[Owner: UX + Engineering]`
- [x] `I18N-013` Translate tables, filters, column settings, pagination and empty states. `[Evidence: reusable bilingual TanStack DataTable and customer representative page; verified 4 Aug 2026]`
- [ ] `I18N-014` Translate validation, permission, workflow and system error messages. `[Owner: Engineering]`
- [ ] `I18N-015` Translate workflow task names, approval decisions, reminders and escalations. `[Owner: Workflow + Product]`
- [ ] `I18N-016` Implement bilingual controlled reference data using stable codes. `[Owner: Master Data]`
- [ ] `I18N-017` Preserve original user-entered language and explicitly model approved translated content where required. `[Owner: Data]`
- [ ] `I18N-018` Support Chinese/English names, aliases, codes and document numbers in search. `[Owner: Search/Application]`
- [ ] `I18N-019` Verify Style, Tech Pack, BOM, Fitting and QC terminology in both languages. `[Owner: Product Development + Quality]`
- [ ] `I18N-020` Verify procurement, production, inventory and finance terminology in both languages. `[Owner: Operations + Finance]`

### 12.3 Formatting, Documents and Notifications

- [x] `I18N-021` Format dates/times by locale and user timezone while storing UTC. `[Evidence: i18n/format.ts and timezone tests; verified 4 Aug 2026]`
- [x] `I18N-022` Format numbers, currency and measurement units by locale without changing underlying precision. `[Evidence: Intl-based currency, number and measurement formatters with tests; verified 4 Aug 2026]`
- [ ] `I18N-023` Generate Chinese and English Excel column labels and controlled values. `[Owner: Reporting]`
- [ ] `I18N-024` Embed licensed Chinese-capable fonts in PDF/Tech Pack/report generation. `[Owner: Reporting + Legal]`
- [ ] `I18N-025` Test PDF pagination, wrapping, glyphs and mixed Chinese/English content. `[Owner: QA]`
- [ ] `I18N-026` Version and approve Chinese/English email, inbox, SMS and push templates. `[Owner: Product + Operations]`
- [ ] `I18N-027` Record outbound message locale and template version. `[Owner: Notification Team]`
- [ ] `I18N-028` Localise job progress and failure diagnostics without changing canonical error codes. `[Owner: Worker Team]`
- [ ] `I18N-029` Make import mapping understand approved Chinese and English column aliases. `[Owner: Import Team]`
- [ ] `I18N-030` Preserve source-language values and provenance during import/AI extraction. `[Owner: Import Team]`

### 12.4 Quality and Release Controls

- [ ] `I18N-031` Add CI checks for missing/unused keys and placeholder mismatches. `[Owner: Engineering]`
- [ ] `I18N-032` Add pseudo-localisation or text-expansion visual testing. `[Owner: UX + QA]`
- [ ] `I18N-033` Add Playwright language-switch persistence tests. `[Owner: QA]`
- [ ] `I18N-034` Run every critical Release 1 workflow in `zh-CN`. `[Owner: QA + Chinese Super Users]`
- [ ] `I18N-035` Run every critical Release 1 workflow in `en-AU`. `[Owner: QA + Australian Super Users]`
- [ ] `I18N-036` Verify permission and audit meaning is identical across languages. `[Owner: Security + QA]`
- [ ] `I18N-037` Verify no untranslated raw keys or blank actions in production build. `[Owner: QA]`
- [ ] `I18N-038` Verify Chinese office font/assets do not depend on inaccessible third-party CDNs. `[Owner: Platform + QA]`
- [ ] `I18N-039` Complete bilingual accessibility and keyboard review. `[Owner: UX + QA]`
- [ ] `I18N-040` Obtain bilingual terminology and workflow acceptance. `[Approvers: Chinese and Australian Business Owners]`
- [ ] `I18N-GATE` Internationalisation gate approved for the release; all critical workflows, documents and notifications pass in both supported locales. `[Approvers: Product + UX + QA]`

## 13. Deferred AWS Release Checklist

- [ ] `REL-001` Release scope, change list, risks and support owner approved.
- [ ] `REL-002` CI quality, security and container scans pass.
- [ ] `REL-003` SBOM, image signature and immutable image digest recorded.
- [ ] `REL-004` Infrastructure plan reviewed and applied successfully.
- [ ] `REL-005` Backup/recovery readiness confirmed for migration risk.
- [ ] `REL-006` One-off migration task completes and logs are archived.
- [ ] `REL-007` New Web and Worker task definitions reference the approved digest.
- [ ] `REL-008` ECS deployment circuit breaker and rollback remain enabled.
- [ ] `REL-009` Web tasks become healthy across Availability Zones.
- [ ] `REL-010` Worker task count and concurrency match release limits.
- [ ] `REL-011` Authentication and permission smoke tests pass.
- [ ] `REL-012` Critical read/write transaction and audit smoke tests pass.
- [ ] `REL-013` File upload/private download smoke test passes.
- [ ] `REL-014` Queue submission, processing, retry and diagnostics smoke test passes.
- [ ] `REL-015` Error rate, latency, saturation, queue age and DB connections remain acceptable.
- [ ] `REL-016` China and Australia synthetic/office checks pass where required.
- [ ] `REL-017` Product/Operations approve promotion or production reopening.
- [ ] `REL-018` Release evidence, task revisions, migration and rollback references are archived.

## 14. First Actions to Assign

- [ ] `NEXT-001` Assign owners and dates for every Phase 0 item.
- [ ] `NEXT-002` Hold the Release 1 scope and domain-owner workshop.
- [ ] `NEXT-003` Approve the Next.js architecture ADR.
- [ ] `NEXT-004` Select ORM, identity, queue and UI spike owners.
- [ ] `NEXT-005` Build the first real production Docker image.
- [ ] `NEXT-006` Build the Docker Compose dependency stack and seed profile.
- [ ] `NEXT-007` Run clean-machine onboarding validation.
- [ ] `NEXT-008` Keep the AWS staging work deferred until the core local business-flow Gate is approved.
- [ ] `NEXT-009` Before AWS work begins, confirm budget, owners, staging entry criteria and target date.
- [ ] `NEXT-010` Re-baseline schedule, staffing and cost after Phase 0 evidence.
