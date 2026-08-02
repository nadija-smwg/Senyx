# Analysis Summary — SENYX ERP System

## Document Sources

| Document | Version | Purpose |
|---|---|---|
| **ERP_SRS.md** | v1.1 (Draft) | Software Requirements Specification — functional & non-functional requirements |
| **ERP_TDD.md** | v1.0 (Draft) | Technical Design Document — schema, APIs, TypeScript interfaces, architecture |

---

## System Overview

An **internal, enterprise-grade ERP** for SENYX Software (Pvt) Ltd — an IT & AI company that delivers client solutions and builds AI products. The system unifies **Sales → Projects → Finance** with HR as the single source of truth for people.

---

## Modules Identified

| # | Module | Key Functions |
|---|---|---|
| 1 | **Authentication & Sessions** | Email+password login, 2FA, session tracking (device/browser/IP/duration), configurable timeout, force-terminate |
| 2 | **RBAC (Roles & Permissions)** | Configurable roles & designations (separate concepts), module+action+scope permissions, RLS enforcement |
| 3 | **HR & People** | Employee master data (single source of truth), departments, designations, skills matrix, leave management, payroll, performance reviews |
| 4 | **CRM** | Accounts (clients), contacts, interaction history, follow-up activities/tasks, tagging & segmentation |
| 5 | **Sales** | Deal pipeline (any employee can create), stage history, quotes, deal health indicators, win/loss tracking, commission attribution |
| 6 | **Projects** | Solution (client) & Product (internal) types, Project Owner, Kanban board (drag-and-drop), resource assignments, delivery milestones, project risks |
| 7 | **Time & Clock** | Project time clock (clock in/out), manual time entries, billable/non-billable tracking, per-employee/task/project totals |
| 8 | **Payment Schedule** | Milestone-based collection (percentage splits summing to 100%), phase completion triggers invoice generation |
| 9 | **Finance** | Invoicing (from deals/milestones/time), expenses, payments, recurring subscriptions (MRR/ARR), multi-currency, accounts receivable/payable |
| 10 | **Notifications & Reminders** | In-app + email notifications, automated due-date emails to Project Owners, configurable reminder schedules |
| 11 | **Documents** | Upload to object storage (Cloudflare R2), signed URL delivery, permission-inherited access, file type/size validation |
| 12 | **Analytics & Reporting** | Multi-criteria filtering (AND/OR logic), role-aware dashboards, KPI widgets, standard reports, PDF/CSV export, scheduled reports |
| 13 | **Activity Tracking & Audit** | Immutable append-only audit log, field-level before/after, device/browser/IP/API route capture, session reconstruction |
| 14 | **Help / User Manual** | In-app searchable help, role-aware content, admin-editable without deployment |
| 15 | **Settings** | Key-value configuration store for pipeline stages, board columns, milestone templates, leave types, etc. |

---

## Technology Stack (As Specified)

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js (App Router) + TypeScript | Single deployable, API-first, server components + route handlers |
| **Database** | PostgreSQL (Supabase) | Relational integrity, transactions, RLS, free tier (commercial OK) |
| **ORM** | Drizzle ORM (TypeScript-first) | Clean typing, plays well with Supabase RLS |
| **Auth** | Supabase Auth (email/password + 2FA) | Managed sessions, JWT claims for RLS |
| **Object Storage** | Cloudflare R2 (S3-compatible) | 10 GB free, zero egress, signed URLs |
| **Email** | Resend (behind `EmailProvider` interface) | Free tier, swappable |
| **Hosting** | Netlify / Cloudflare Pages | Free tier, commercial-use permitted |
| **Scheduler** | Platform cron (GitHub Actions / Netlify scheduled functions) | Free; drives reminders & reports |
| **Validation** | Zod | Schema validation shared between client and server |
| **IDs** | UUID v4 (`gen_random_uuid()`) | Non-guessable, distributed-safe |

---

## Database Tables Inventory (37 tables)

### Identity & RBAC (6)
`users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions`

### HR & People (10)
`departments`, `designations`, `employees`, `skills`, `employee_skills`, `leave_types`, `leave_balances`, `leave_requests`, `payroll_records`, `performance_reviews`

### CRM (5)
`accounts`, `contacts`, `interactions`, `activities`, `tags`, `taggables`

### Sales (3)
`deals`, `deal_stage_history`, `quotes`

### Projects (9)
`projects`, `project_assignments`, `board_columns`, `tasks`, `milestones`, `payment_milestones`, `time_entries`, `clock_sessions`, `project_risks`

### Finance (5)
`invoices`, `invoice_line_items`, `expenses`, `payments`, `subscriptions`

### Platform (5)
`documents`, `notifications`, `audit_logs`, `reminder_schedules`, `settings`

---

## API Routes (70+ endpoints)

Organized under `/app/api/*` with REST conventions:
- **Auth & Session** — 8 routes (login, logout, 2FA, password reset, me, sessions)
- **RBAC & Settings** — 4 route groups (roles CRUD, permissions list, settings)
- **HR** — 12 route groups (employees, designations, departments, skills, leave, payroll, reviews)
- **CRM & Sales** — 7 route groups (accounts, contacts, interactions, activities, deals, stage/close, quotes)
- **Projects** — 13 route groups (projects CRUD, board, tasks, move, assignments, milestones, payment milestones, time entries, clock, risks, summary)
- **Finance** — 4 route groups (invoices, expenses, payments, subscriptions)
- **Platform** — 8 route groups (documents, notifications, analytics dashboard/query, reports, audit logs)

---

## Key Business Rules

1. **People are HR-owned** — created only in HR, every other module references existing employees
2. **Anyone can sell** — any authenticated employee can create and own deals
3. **Deal → Project flow** — won deal triggers guided project creation with payment schedule
4. **One Project Owner** — accountable for delivery, receives automated due-date emails
5. **Milestone payments sum to 100%** — enforced by trigger + service layer
6. **Phase completion → draft invoice** — not auto-issued, requires review
7. **One active clock per employee** — enforced by partial unique index
8. **Soft deletes only** — `deleted_at` timestamp, no hard deletions
9. **Immutable audit** — append-only, every state change recorded with full context
10. **Designation ≠ Role** — designations are job titles (HR fact), roles are permission sets (access control)

---

## Non-Functional Requirements

| Area | Key Requirement |
|---|---|
| **Performance** | < 2s response, optimistic board updates, indexed queries |
| **Security** | RBAC + RLS (defence in depth), encrypted sensitive fields, HTTPS-only |
| **Scalability** | Audit archival, indexed analytics, graceful degradation |
| **Auditability** | No action without audit record, referential integrity, soft deletes |
| **Usability** | Minimal-step workflows, inline help, configurable without code |
| **Cost** | Free-tier deployable, commercial-use permitted services only |

---

*This analysis forms the foundation for the frontend, backend, database, and CI/CD blueprints that follow.*
