# Software Requirements Specification (SRS)
## Enterprise Resource Planning System
### SENYX Software (Pvt) Ltd

| Field | Value |
|---|---|
| **Company** | SENYX Software (Pvt) Ltd |
| **Document** | Software Requirements Specification |
| **System** | Internal Enterprise ERP (IT & AI Services + Products) |
| **Version** | 1.1 (Final) |
| **Status** | For review |
| **Deployment** | Internal system |
| **Recommended Stack** | Next.js (App Router) · Netlify (hosting) · Supabase (PostgreSQL + Auth + RLS) · Cloudflare R2 (documents) · free transactional email |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [User Classes, Roles & Designations](#3-user-classes-roles--designations)
4. [Functional Requirements](#4-functional-requirements)
5. [Enterprise Analytics & Filtering Requirements](#5-enterprise-analytics--filtering-requirements)
6. [Activity Tracking & Audit Requirements](#6-activity-tracking--audit-requirements)
7. [External Interface Requirements](#7-external-interface-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Data Requirements (High-Level)](#9-data-requirements-high-level)
10. [Assumptions, Constraints & Dependencies](#10-assumptions-constraints--dependencies)
11. [Appendices](#11-appendices)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the complete functional and non-functional requirements for an internal, enterprise-grade ERP system for SENYX Software (Pvt) Ltd, an IT and AI company. SENYX delivers client IT/AI solutions and builds its own AI products. This SRS is the authoritative reference for design, implementation, testing, and acceptance. A separate Technical Design Document (models, APIs, interfaces) follows.

### 1.2 Scope

The ERP is an internal system unifying SENYX's core operations into a single application with a shared data model:

- **Sales & CRM** — company-wide selling (any employee can originate a deal), client and contact management.
- **Projects** — project-based delivery for both Solutions (client) and Products (internal), each with a Project Owner, resource assignment, a Jira-style board, project time clock, and milestone-based payment schedules.
- **Finance** — invoicing and revenue linked to sales deals and to project payment milestones; expenses; profitability.
- **HR** — the single source of truth for people: employee records, designations, skills, leave, and payroll.
- **Reporting & Analytics** — enterprise-level, multi-dimensional analysis with advanced filtering, drill-down, and export.
- **Activity Tracking & Audit** — comprehensive tracking of every action, including device, session duration, API route, and before/after state.
- **Platform services** — authentication, role-based access control, notifications (including automated due-date emails), document storage, and in-app help/user manual.

### 1.3 Definitions, Acronyms & Abbreviations

| Term | Meaning |
|---|---|
| ERP | Enterprise Resource Planning |
| RBAC | Role-Based Access Control |
| RLS | Row-Level Security (database-enforced access) |
| CRM | Customer Relationship Management |
| Solution | A client-facing project (IT/AI service delivery) |
| Product | An internal product build (SENYX's own AI products) |
| Project Owner | The person accountable for delivering a project and tracking everything on it |
| Deal / Opportunity | A potential or in-progress sale |
| Designation | Job title (HR fact), e.g. Senior Developer |
| Role | Permission set (access-control fact), e.g. Finance |
| Payment Milestone | A percentage portion of a project's value, billable when its phase completes |
| Time Entry | A logged block of work against a project/task |
| Project Clock | Clock-in/clock-out capturing live work time against a project |
| MRR / ARR | Monthly / Annual Recurring Revenue |
| Audit Log | Immutable record of a system action |
| Session | An authenticated period of user activity |
| PII | Personally Identifiable Information |

### 1.4 Intended Audience

Product owner, engineering team, QA, and future maintainers. Section 4 onward is written so individual requirements can be traced, tested, and edited independently.

### 1.5 References

- ISO/IEC/IEEE 29148 (requirements engineering) — structural guidance only.
- SENYX role/access, module, and stack decisions agreed during planning (Sections 2–6).

---

## 2. Overall Description

### 2.1 Product Perspective

A new, self-contained, internal web application built from scratch. It is API-first — a Next.js (App Router) front end and server layer over a PostgreSQL database, with an object store for documents/media. The system is SENYX's single source of truth linking **Sales → Projects → Finance**, with people (managed in HR) and their logged work threading through all three.

### 2.2 Product Functions (Summary)

- Company-wide sales origination and pipeline management.
- Client/contact relationship management.
- Project delivery (Solutions and Products) with a Project Owner, Kanban board, project time clock, assignments, and milestone payment schedules.
- Invoicing and revenue linked to deals and project payment milestones; expenses and profitability.
- People management in HR as the single source of truth; designations and RBAC roles kept separate.
- Enterprise analytics with saved, shareable, multi-dimensional filters.
- End-to-end activity tracking and immutable audit trail.
- Notifications, automated due-date emails to Project Owners, document storage, and in-app user manual.

### 2.3 Operating Environment (Recommended Free Stack)

- **Client** — Modern evergreen browsers (Chrome, Edge, Firefox, Safari), desktop and tablet.
- **Application framework** — Next.js (App Router) — server components, route handlers / server actions.
- **Hosting** — Netlify free Starter (commercial use permitted) or Cloudflare Pages. (Vercel's free Hobby plan is non-commercial-only and therefore not suitable for an internal business system; Vercel would require the paid Pro plan.)
- **Database + Auth** — Supabase (PostgreSQL, Auth, and Row-Level Security on the free tier; commercial use permitted). Alternative: Neon (Postgres) + Auth.js.
- **Document/media storage** — Cloudflare R2 (10 GB free, zero egress, commercial use permitted). Cloudinary optional if image transformations are required.
- **Backups** — Scheduled database backup via GitHub Actions to Cloudflare R2 (the free DB tier has no managed backups).
- **Email** — A transactional email service with a free tier (e.g. Resend / Brevo / MailerSend) for notifications and due-date reminders.
- **Region** — Nearest region to Sri Lanka (e.g. Singapore) for latency.
- **Deployment** — Cloud-hosted, HTTPS-only, access gated behind authentication (internal use).

### 2.4 High-Level Constraints

- All persistent business data resides in PostgreSQL; only binary media/documents live in object storage (referenced by secure URL + object key).
- People are created and maintained only in HR; every other module references the existing employee record (Section 3.3).
- Every state-changing operation must be attributable to a user and a session, and must be recorded in the audit trail (Section 6).
- Access rules should be enforced at the database layer (Row-Level Security) in addition to the application layer.
- The system must remain functional and auditable as data volume grows (Section 8).

---

## 3. User Classes, Roles & Designations

### 3.1 Roles vs Designations (must be modelled separately)

- **Designation** is a job title and an HR/organizational fact. A person has exactly one primary designation (e.g. CEO, Senior Developer, ML Engineer, Project Manager, Business Analyst). Designations are configurable.
- **Role** is a permission set governing what a user can see and do (e.g. Admin, Finance, HR, Project Owner, Employee). A user may hold one or more roles. Roles are configurable.
- A user's designation must never implicitly grant permissions; access is determined solely by assigned roles.

| Req ID | Requirement |
|---|---|
| FR-ROL-01 | The system shall support a configurable set of designations (job titles), manageable by an authorized admin. |
| FR-ROL-02 | The system shall support a configurable set of roles, each mapping to a defined set of permissions. |
| FR-ROL-03 | A user shall have exactly one primary designation and may hold multiple roles. |
| FR-ROL-04 | Permissions shall be evaluated per module and per action (view, create, edit, delete, export, approve). |
| FR-ROL-05 | The system shall support record-scope permissions — **all**, **own**, and **assigned**. |
| FR-ROL-06 | Designation shall have no effect on access control; only roles determine permissions. |
| FR-ROL-11 | The system shall provide a Project Owner role granting full management over the projects a user owns, including board, assignments, milestones, and due-date tracking. |

### 3.2 Default Roles & Access Model

Because any employee can originate a sale, Sales/CRM is open to all authenticated users at own scope, with elevated visibility for sales leadership.

| Role | Sales/CRM | Projects | Finance | HR | Analytics | Admin/Settings |
|---|---|---|---|---|---|---|
| **Admin / Owner** | Full | Full | Full | Full | Full | Full |
| **Finance** | View | View | Full | View | Finance scope | – |
| **HR Manager** | – | View | View | Full | HR scope | – |
| **Sales Lead** | Full (all deals) | View | View | – | Sales scope | – |
| **Project Owner** | View | Full (owned/assigned projects) | View (own projects' finance) | – | Project scope | – |
| **Employee (default, all staff)** | Own deals + full CRM contacts | Assigned projects + own time/clock | – | Own records | Own scope | – |

| Req ID | Requirement |
|---|---|
| FR-ROL-07 | Every authenticated employee shall be able to create and manage their own sales deals and manage CRM contacts. |
| FR-ROL-08 | Each deal shall carry an owner field identifying the originating employee, used for credit, commission, and reporting. |
| FR-ROL-09 | Sales Lead and Admin roles shall have visibility across all deals regardless of owner. |
| FR-ROL-10 | The default access matrix shall be a starting configuration and fully editable via the roles/permissions admin. |

### 3.3 People as a Single Source of Truth (HR-owned)

| Req ID | Requirement |
|---|---|
| FR-PPL-01 | People (employees) shall be created and maintained only in the HR module. |
| FR-PPL-02 | All other modules (Projects, Sales, Finance approvals, assignments, Project Owner, deal owner) shall reference an existing HR employee record; no module shall create duplicate person records. |
| FR-PPL-03 | Deactivating a person in HR shall cascade to their access and surface their historical references (past projects, deals, time) without deleting history. |

---

## 4. Functional Requirements

### 4.1 Authentication & Session Management

| Req ID | Requirement |
|---|---|
| FR-AUTH-01 | The system shall authenticate users via email + password, with hashed credential storage. |
| FR-AUTH-02 | The system shall support multi-factor authentication (2FA) as a configurable option. |
| FR-AUTH-03 | The system shall establish a session on login and record session start time, user, device, browser, OS, and IP (see Section 6). |
| FR-AUTH-04 | The system shall record session end and compute session duration ("time period staying"). |
| FR-AUTH-05 | The system shall support configurable session timeout and concurrent session limits. |
| FR-AUTH-06 | Admins shall be able to view active sessions and forcibly terminate any session. |
| FR-AUTH-07 | Password reset shall be available via a secure, time-limited token flow. |
| FR-AUTH-08 | The entire application shall require authentication (internal system); optional IP allowlisting shall be supported. |

### 4.2 User & Employee Management (HR-owned)

| Req ID | Requirement |
|---|---|
| FR-USR-01 | HR/Admin shall create, edit, deactivate, and reactivate people (soft-delete only; no hard deletion of employee records). |
| FR-USR-02 | An employee record shall capture — name, contact details, primary designation, department, reporting manager, employment type, start date, and status. |
| FR-USR-03 | Sensitive fields (salary, bank details, national ID) shall be access-restricted to HR/Admin roles and encrypted at rest. |
| FR-USR-04 | The system shall maintain a skills & certifications matrix per employee for project staffing. |
| FR-USR-05 | The system shall link each user account to exactly one employee record. |

### 4.3 CRM

| Req ID | Requirement |
|---|---|
| FR-CRM-01 | The system shall maintain Accounts (client companies) — name, industry, size, website, address, status. |
| FR-CRM-02 | The system shall maintain Contacts linked to accounts — name, email, phone, title. |
| FR-CRM-03 | The system shall record an interaction history (calls, emails, meetings, notes) against accounts and contacts. |
| FR-CRM-04 | The system shall support activities/tasks with due dates, assignees, and reminders. |
| FR-CRM-05 | The system shall support tagging and segmentation of accounts and contacts. |
| FR-CRM-06 | All CRM records shall be searchable and filterable (Section 5). |

### 4.4 Sales

| Req ID | Requirement |
|---|---|
| FR-SAL-01 | Any authenticated employee shall create a deal with — name, linked account, value/amount, currency, stage, probability, expected close date, source, and owner. |
| FR-SAL-02 | The system shall support a configurable pipeline of stages (e.g. Lead → Qualified → Proposal → Negotiation → Won/Lost). |
| FR-SAL-03 | The system shall record every stage change with timestamp and actor, forming a stage-history timeline. |
| FR-SAL-04 | The system shall compute deal health indicators — days in current stage, days since last activity, and configurable risk flags. |
| FR-SAL-05 | The system shall support quotes/proposals linked to a deal, including document attachments. |
| FR-SAL-06 | On a deal reaching Won, the system shall support (auto or guided) creation of a linked Project (typed Solution or Product) and its initial payment schedule. |
| FR-SAL-07 | The system shall record win/loss reason on closure. |
| FR-SAL-08 | The system shall compute weighted pipeline value (amount × probability) for forecasting. |
| FR-SAL-09 | The system shall track commission/credit attribution per deal owner. |

### 4.5 Projects

#### 4.5.1 Core

| Req ID | Requirement |
|---|---|
| FR-PRJ-01 | The system shall maintain projects — name, type (Solution / Product), linked client/deal (Solutions), billing type (fixed / time & materials / retainer), status, start & end dates, budget, and assigned Project Owner. |
| FR-PRJ-02 | Each project shall have exactly one Project Owner (an HR person) accountable for delivery and for tracking everything on the project. |
| FR-PRJ-03 | The system shall support tasks and subtasks with assignee, status, priority, estimated hours, due date, and board column. |
| FR-PRJ-04 | The system shall support milestones and deliverables with target dates and completion status. |
| FR-PRJ-05 | The system shall support resource assignment — recording which employees are assigned to a project ("who worked on which project"), referencing HR people. |
| FR-PRJ-06 | The system shall maintain a risks/issues log per project. |
| FR-PRJ-07 | Project documents shall be stored in object storage and linked to the project record. |
| FR-PRJ-08 | The system shall compute project budget vs actual and profitability (revenue vs cost of logged hours). |

#### 4.5.2 Jira-style Board

| Req ID | Requirement |
|---|---|
| FR-PRJ-10 | The system shall provide a Kanban board per project with configurable columns (e.g. Backlog, To Do, In Progress, Review, Done). |
| FR-PRJ-11 | Users shall move task cards between columns via drag-and-drop; column changes shall be recorded (with actor and timestamp) and audited. |
| FR-PRJ-12 | Cards shall display key task data (title, assignee, priority, due date, estimate) and open a detail view. |
| FR-PRJ-13 | The board shall support filtering and swimlanes (e.g. by assignee or priority). |

#### 4.5.3 Time Clock & Time Logging

| Req ID | Requirement |
|---|---|
| FR-PRJ-14 | The system shall provide a project time clock — employees clock in and clock out against a specific project (and optionally task), capturing start time, end time, and computed duration. |
| FR-PRJ-15 | The system shall also support manual time entries (date, hours, description, billable/non-billable) against a project/task. |
| FR-PRJ-16 | Clocked and manually-entered time shall be reconciled into per-employee, per-task, and per-project totals for billing and contribution reporting. |
| FR-PRJ-17 | Time records shall be attributable to the HR person and to a session, and shall be auditable. |

#### 4.5.4 Payment Schedule (Milestone-based Collection)

| Req ID | Requirement |
|---|---|
| FR-PRJ-18 | Each project shall support a payment schedule dividing the project value into ordered payment milestones, each with a name, linked phase, and percentage of total value (e.g. Requirement gathering 30%, Design 20%, Development 30%, Delivery 20%). |
| FR-PRJ-19 | Milestone percentages shall be configurable per project and shall be validated to total 100%. |
| FR-PRJ-20 | Each milestone shall have a status (Pending → Due → Invoiced → Paid) and an expected collection date. |
| FR-PRJ-21 | Completing a milestone's phase shall mark the corresponding payment due/collectable and shall be able to generate a linked invoice in Finance (auto or guided). |
| FR-PRJ-22 | The Project Owner shall see, per project, which payments are collected, due, or overdue, and the total collected vs remaining. |

### 4.6 Finance

| Req ID | Requirement |
|---|---|
| FR-FIN-01 | The system shall generate invoices derived from a deal's agreed value, a project's billable time, or a project payment milestone. |
| FR-FIN-02 | An invoice shall capture — invoice number, client, linked deal/project/milestone, line items, amount, tax, issue date, due date, status (draft/sent/paid/overdue), and payment date. |
| FR-FIN-03 | The system shall record expenses/bills — vendor, category, amount, date, approval status, and receipt (object storage). |
| FR-FIN-04 | The system shall record payments linked to invoices/milestones or bills, with method, amount, and date. |
| FR-FIN-05 | The system shall support recurring revenue for AI products (subscription value, MRR/ARR). |
| FR-FIN-06 | The system shall link finance records to Sales (deal), Projects, and payment milestones so revenue, cost, and profitability are traceable end to end. |
| FR-FIN-07 | The system shall support multiple currencies with a recorded exchange rate per transaction. |
| FR-FIN-08 | The system shall provide accounts receivable and payable views (outstanding, overdue, aging), including milestone collections. |
| FR-FIN-09 | Finance approval actions (invoice issue, expense approval) shall be permission-gated and audited. |

### 4.7 HR

| Req ID | Requirement |
|---|---|
| FR-HR-01 | The system shall maintain employee master data (see FR-USR-02) and designations (Section 3) as the single source of truth for people. |
| FR-HR-02 | The system shall support leave management — leave types, balances, requests, and an approval workflow. |
| FR-HR-03 | The system shall support payroll data — salary components, deductions, and payslip generation/export. |
| FR-HR-04 | The system shall support performance reviews and goals per employee. |
| FR-HR-05 | The system shall store HR documents (contracts, NDAs) in object storage with restricted access. |
| FR-HR-06 | HR sensitive data shall be visible only to HR/Admin roles and every access shall be audited. |

### 4.8 Notifications & Automated Reminders

| Req ID | Requirement |
|---|---|
| FR-NOT-01 | The system shall send notifications for key events — approaching deadlines, overdue invoices/milestones, approval requests, deal stage changes, and assignments. |
| FR-NOT-02 | Notifications shall be delivered in-app and via email, with per-user preferences. |
| FR-NOT-03 | The system shall automatically email the Project Owner about upcoming and due dates on their projects (task due dates, milestones, deliverables, payment collections), on a configurable schedule (e.g. daily digest + advance reminders). |
| FR-NOT-04 | Notification and email dispatch shall be recorded for audit. |

### 4.9 Document Management (Object Storage)

| Req ID | Requirement |
|---|---|
| FR-DOC-01 | The system shall upload documents/media to object storage and store the returned secure reference (URL + object key) against the owning record. |
| FR-DOC-02 | Document access shall respect the permissions of the record it is attached to. |
| FR-DOC-03 | Upload, replacement, and deletion of documents shall be audited. |
| FR-DOC-04 | The system shall enforce allowed file types and size limits, validated server-side. |

### 4.10 Help / User Manual

| Req ID | Requirement |
|---|---|
| FR-HLP-01 | The system shall provide an in-app, searchable Help section (user manual) covering core workflows. |
| FR-HLP-02 | Help content shall be role-aware where practical. |
| FR-HLP-03 | The system shall provide separate administrative/technical documentation for user, role, and settings management. |
| FR-HLP-04 | Help content shall be editable by authorized admins without a code deployment. |

---

## 5. Enterprise Analytics & Filtering Requirements

### 5.1 Filtering Engine

| Req ID | Requirement |
|---|---|
| FR-ANL-01 | Every list/report view shall support multi-criteria filtering combining any number of fields with AND/OR logic. |
| FR-ANL-02 | The system shall support operators — equals, not equals, contains, in-list, greater/less than, between, is-empty, and date-relative ("last 30 days", "this quarter", "year to date"). |
| FR-ANL-03 | The system shall support date-range filtering and period comparison (this quarter vs last quarter, this year vs last year). |
| FR-ANL-04 | Users shall save named filter sets and reuse them; authorized users shall share saved filters at team level. |
| FR-ANL-05 | The system shall support cross-module filtering (e.g. clients with won deals over X whose projects are over budget or have overdue milestones). |
| FR-ANL-06 | Filtering shall respect the requesting user's record-scope permissions at all times. |

### 5.2 Dashboards & KPIs

| Req ID | Requirement |
|---|---|
| FR-ANL-07 | The system shall provide role-aware dashboards composed of configurable KPI widgets and charts. |
| FR-ANL-08 | KPIs shall include — revenue vs expenses, project profitability, milestone collections (collected/due/overdue), resource utilization, pipeline value & forecast, sales-by-employee, MRR/ARR, and outstanding invoices. |
| FR-ANL-09 | Users shall drill down from any KPI/chart into the underlying records. |
| FR-ANL-10 | Dashboards shall support the same date-range and comparison controls as the filtering engine. |
| FR-ANL-19 | The Project Owner shall have a dedicated project dashboard summarizing board status, upcoming/overdue dates, time logged, and payment milestone status. |

### 5.3 Reporting & Export

| Req ID | Requirement |
|---|---|
| FR-ANL-11 | The system shall provide standard reports — project profitability, contribution (hours per person per project), sales pipeline & forecast, sales-by-person, milestone collection status, financial summary (P&L view), and receivables aging. |
| FR-ANL-12 | Reports shall be exportable to PDF and Excel/CSV. |
| FR-ANL-13 | Reports shall be built dynamically over live data and honor active filters. |
| FR-ANL-14 | The system shall support scheduled report generation and delivery as a configurable option. |
| FR-ANL-15 | Every report generation and export shall be audited (who, what, when, filter set applied). |

### 5.4 Analytics on Activity Data

| Req ID | Requirement |
|---|---|
| FR-ANL-16 | The system shall provide analytics over the activity/audit dataset — actions per user, per module, per API route, and per time period. |
| FR-ANL-17 | The system shall report session analytics — session counts, average session duration, active-time distribution, and device/browser breakdown. |
| FR-ANL-18 | Activity analytics shall be filterable by user, role, module, date range, and device. |

---

## 6. Activity Tracking & Audit Requirements

A first-class, always-on subsystem. Every action in the ERP is tracked. **This is a hard requirement, not a feature toggle.**

### 6.1 Scope of Tracking

| Req ID | Requirement |
|---|---|
| FR-AUD-01 | The system shall record an audit entry for every state-changing operation (create, update, delete, approve, status/column change, clock in/out, export, login, logout). |
| FR-AUD-02 | The system shall optionally record read/access events for sensitive data (HR, finance, PII), configurable per data class. |
| FR-AUD-03 | Audit entries shall be immutable — append-only, never editable or deletable through the application. |
| FR-AUD-04 | Audit tracking shall be enforced centrally (server-side) so no action can bypass it. |

### 6.2 Captured Attributes

Each audit entry shall capture at minimum:

| Attribute | Description |
|---|---|
| Actor | User ID and (if applicable) role in effect |
| Session ID | The session the action occurred within |
| Timestamp | Server-side UTC timestamp |
| Action | The operation performed (e.g. `deal.update`, `invoice.issue`, `task.move`) |
| API route | The route/endpoint invoked (e.g. `PATCH /api/deals/:id`) |
| Entity | Target entity type and record ID |
| Before / After | Field-level previous and new values for updates |
| Device | Device type, operating system |
| Browser | Browser name and version |
| IP address | Source IP of the request |
| Result | Success or failure (and error code on failure) |

| Req ID | Requirement |
|---|---|
| FR-AUD-05 | The system shall capture the invoked API route/action for every audited operation. |
| FR-AUD-06 | The system shall capture device, OS, browser, and IP for every audited operation. |
| FR-AUD-07 | For updates, the system shall record before and after values at field level. |
| FR-AUD-08 | The system shall associate each audit entry with its session, enabling reconstruction of a full user timeline. |

### 6.3 Session & Time Tracking

| Req ID | Requirement |
|---|---|
| FR-AUD-09 | The system shall record session start/end and compute session duration ("time period staying"). |
| FR-AUD-10 | The system shall distinguish three time concepts — project clock time (clock in/out), logged work hours (time entries), and system session time (presence in the app). All three are tracked, for different purposes. |
| FR-AUD-11 | The system shall support reconstructing, for any user, a chronological activity timeline across sessions. |
| FR-AUD-12 | The system shall retain audit and session data per a configurable retention policy, archiving rather than deleting long-term records. |

### 6.4 Access to Audit Data

| Req ID | Requirement |
|---|---|
| FR-AUD-13 | Audit and activity logs shall be viewable only by Admin (and optionally a dedicated Auditor role). |
| FR-AUD-14 | Audit views shall be filterable and analyzable per Section 5.4. |
| FR-AUD-15 | Any access to the audit log itself shall be audited. |

---

## 7. External Interface Requirements

### 7.1 User Interface

Responsive web UI (desktop-first, tablet-capable), consistent design system, keyboard-accessible, sentence-case labeling, role-aware navigation, and a drag-and-drop Kanban board.

### 7.2 Software Interfaces

| Req ID | Requirement |
|---|---|
| FR-INT-01 | The system shall integrate with an object storage service (Cloudflare R2 recommended) for document upload, secure delivery, and deletion. |
| FR-INT-02 | The system shall integrate with a transactional email provider for notifications, due-date reminders, and password flows. |
| FR-INT-03 | All external calls shall be server-side; secrets shall never be exposed to the client. |
| FR-INT-04 | The system shall expose an internal API-first layer (route handlers) that the front end consumes; the API is the enforcement point for auth, RBAC, and audit. |
| FR-INT-05 | Where the database supports it, access rules shall additionally be enforced via Row-Level Security. |

### 7.3 Communication Interfaces

HTTPS/TLS for all traffic. JSON as the primary data-interchange format.

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Req ID | Requirement |
|---|---|
| NFR-PERF-01 | Standard list/detail views shall respond within 2 seconds under normal load. |
| NFR-PERF-02 | Filtered analytics queries shall be optimized via indexing and pagination; large exports shall run asynchronously. |
| NFR-PERF-03 | The Kanban board shall reflect card moves optimistically and persist within 1 second. |

### 8.2 Security & Privacy

| Req ID | Requirement |
|---|---|
| NFR-SEC-01 | All access shall be authenticated and authorized via RBAC at the API layer, and via Row-Level Security at the database layer where available. |
| NFR-SEC-02 | Credentials shall be hashed; sensitive fields (salary, bank, national ID) encrypted at rest. |
| NFR-SEC-03 | The system shall protect against common web vulnerabilities (injection, XSS, CSRF, broken access control). |
| NFR-SEC-04 | Sensitive data access shall follow least privilege and be fully audited. |
| NFR-SEC-05 | As an internal system, the application shall be gated behind authentication, with optional IP allowlisting. |
| NFR-SEC-06 | Regular database backups shall be maintained (e.g. scheduled export to object storage) given the free DB tier lacks managed backups. |

### 8.3 Scalability & Availability

| Req ID | Requirement |
|---|---|
| NFR-SCL-01 | The data model and queries shall remain performant as records grow (audit/activity data especially); audit archival shall be supported. |
| NFR-SCL-02 | The system shall degrade gracefully and retry safely for external services. |

### 8.4 Auditability & Data Integrity

| Req ID | Requirement |
|---|---|
| NFR-AUD-01 | No business action shall be possible without a corresponding, attributable audit record. |
| NFR-AUD-02 | Referential integrity across Sales, Projects, Finance, and HR shall be enforced at the database level. |
| NFR-AUD-03 | Deletions of business records shall be soft-deletes preserving history. |

### 8.5 Usability & Maintainability

| Req ID | Requirement |
|---|---|
| NFR-USE-01 | Common workflows (clock in, log time, create deal, move a card, raise an invoice) shall be achievable in minimal steps with inline help. |
| NFR-MNT-01 | Roles, permissions, designations, pipeline stages, board columns, milestone templates, leave types, and help content shall be configurable without code changes. |

### 8.6 Cost

| Req ID | Requirement |
|---|---|
| NFR-COST-01 | The system shall be deployable on free-tier services that permit commercial/internal business use, avoiding tiers restricted to personal/non-commercial use. |

---

## 9. Data Requirements (High-Level)

Core entities (detailed schema in the Technical Design Document):

- **User, Employee, Designation, Role, Permission**
- **Account** (client), **Contact, Interaction, Activity**
- **Deal, DealStageHistory, Quote**
- **Project** (type — Solution/Product), **Task, BoardColumn, Milestone, ProjectAssignment, ProjectOwner** (ref Employee)
- **PaymentMilestone** (percentage, phase, status, due date), **TimeEntry, ClockSession**
- **Invoice, InvoiceLineItem, Expense, Payment, Subscription**
- **LeaveRequest, PayrollRecord, PerformanceReview**
- **Document** (object-storage reference)
- **Notification, ReminderSchedule**
- **Session, AuditLog**

### Key Relationships

- A won **Deal** yields a typed **Project** with a **PaymentMilestone** schedule.
- **Employees** (from HR) are assigned to projects and are the **Project Owner**.
- **ClockSession**/**TimeEntry** link Employee ↔ Project and feed billing.
- Completing a phase marks a **PaymentMilestone** due, generating an **Invoice**.
- Every record change yields an **AuditLog** entry bound to a **Session**.

---

## 10. Assumptions, Constraints & Dependencies

- The application is built on Next.js and PostgreSQL and deployed on free-tier services that permit internal/commercial business use.
- Business/relational data lives in PostgreSQL; only binary assets live in object storage.
- People are created only in HR; every other module references those records.
- Sales is company-wide; every employee can originate deals at own scope.
- Each project has one Project Owner responsible for delivery and tracking, and receives automated due-date emails.
- Availability of external email and object-storage services is assumed for notification and document features.
- The default role/access matrix (Section 3.2) is a starting point, expected to be tuned in configuration.
- Vercel's free plan is unsuitable (non-commercial-only); a commercial-use-permitted host (Netlify / Cloudflare Pages) or a paid Vercel plan is required.

---

## 11. Appendices

### Appendix A — Requirement ID Prefixes

| Prefix | Area |
|---|---|
| FR-ROL | Roles, designations, access |
| FR-PPL | People (HR single source of truth) |
| FR-AUTH | Authentication & sessions |
| FR-USR | User/employee management |
| FR-CRM | CRM |
| FR-SAL | Sales |
| FR-PRJ | Projects (core, board, time clock, payment schedule) |
| FR-FIN | Finance |
| FR-HR | HR |
| FR-NOT | Notifications & reminders |
| FR-DOC | Documents |
| FR-HLP | Help / manual |
| FR-ANL | Analytics & reporting |
| FR-AUD | Activity tracking & audit |
| FR-INT | External interfaces |
| NFR-* | Non-functional requirements |

### Appendix B — Out of Scope (v1)

- Client-facing external portal (system is internal-first; may be a later phase).
- Native mobile applications (web is responsive).
- Third-party accounting-system sync (possible later integration).

### Appendix C — Open Questions for Tier 2

1. Milestone completion → should invoices auto-generate, or require Project Owner/Finance review before issue?
2. Is a dedicated Auditor role required in v1, or is Admin-only audit access sufficient?
3. Which transactional email provider is the target?
4. Should the project clock enforce one active clock-in at a time per person, or allow parallel project clocks?

---

*End of SRS v1.1 (Final) — SENYX Software (Pvt) Ltd. The Technical Design Document (data models, API routes, TypeScript interfaces) follows separately.*
