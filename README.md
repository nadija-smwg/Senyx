# senyx-software

An internal, enterprise-grade ERP system built for **SENYX Software (Pvt) Ltd**. This system unifies Sales, Projects, and Finance workflows with HR acting as the single source of truth for the organization.

## 📋 Project Overview

The SENYX ERP is designed to manage the full lifecycle of an IT & AI consultancy business:
1. **Sales & CRM:** Manage client accounts, track interactions, and drive deals through the pipeline to closure.
2. **Projects:** Convert won deals into projects. Manage Kanban boards, allocate team members, log time, and track delivery milestones.
3. **Finance:** Trigger invoices from completed milestones, manage expenses, record payments, and track recurring AI product subscriptions.
4. **HR & People:** Centralized employee directory, leave management, payroll processing, and performance reviews.

## 🏗️ Technology Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router, React Server Components) |
| **Language** | TypeScript (Strict mode) |
| **Database** | PostgreSQL 15+ (via Supabase) |
| **ORM** | Drizzle ORM |
| **Authentication** | Supabase Auth (Email/Password, JWT, 2FA) |
| **Styling** | Tailwind CSS + Radix UI Primitives |
| **Forms & Validation**| React Hook Form + Zod |
| **Storage (Docs)** | Cloudflare R2 (S3-compatible) |
| **Email** | Resend |
| **Deployment** | Netlify / Cloudflare Pages |

## 🛡️ Security Architecture

- **Defense in Depth:** Application-level RBAC combined with Database-level Row-Level Security (RLS).
- **Data Privacy:** Sensitive HR and Financial data (e.g., salaries, bank details, national IDs) are encrypted at rest using AES-256-GCM.
- **Audit Trail:** Append-only, immutable `audit_logs` table tracks every state-changing action with before/after JSON diffs, IP, and device info.
- **Data Retention:** Soft-delete (`deleted_at`) strategy across all business entities to preserve historical integrity.

## 🚀 Local Development Setup

We provide two ways to run the application locally: **Docker (Recommended)** or **Native**.

### Option A: Docker Compose (Recommended)

This sets up PostgreSQL, MinIO (local R2 replacement), and Mailpit (local email testing) for you.

1. **Clone the repository**
   ```bash
   git clone https://github.com/senyx-software/erp.git
   cd erp
   ```

2. **Setup Environment**
   ```bash
   cp .env.docker.example .env.docker
   # Add your Supabase Cloud credentials to .env.docker
   ```

3. **Start Services**
   ```bash
   make dev
   ```

4. **Initialize Database**
   ```bash
   make db-push
   make db-seed
   ```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Option B: Native Setup

Requires Node.js 20+ and a connected Supabase project.

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Fill in all cloud credentials (Supabase, R2, Resend, etc.)
   ```

3. **Initialize Database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Repository Structure

```
src/
├── app/                  # Next.js App Router pages and layouts
├── components/           # React components
│   ├── ui/               # Base UI primitives (buttons, inputs, etc.)
│   ├── layout/           # Sidebar, topbar, shell
│   └── [module]/         # Domain-specific components (e.g., board, forms)
├── hooks/                # Custom React hooks (e.g., useAuth, usePermissions)
├── lib/                  # Shared utilities and client configurations
└── server/               # Backend logic
    ├── db/               # Drizzle schemas, migrations, and seed scripts
    ├── middleware/       # Auth, RBAC, and Validation wrappers
    ├── services/         # Core business logic (Auth, HR, Projects, etc.)
    └── types/            # Shared TypeScript interfaces and Zod schemas
```

## 📜 Documentation & Implementation Plans

Full implementation blueprints and phase-by-phase plans are located in the `implementation/` and `new_md/` directories.

- **[Master Plan](implementation/00_master_plan.md):** 8-phase roadmap
- **[Database Blueprint](new_md/04_database_blueprint.md):** Complete ERD and table schemas
- **[API Reference](new_md/06_api_functions_reference.md):** All 105+ internal API routes

## 🔒 License

Copyright © 2026 SENYX Software (Pvt) Ltd. All rights reserved.
This is proprietary internal software. Unauthorized copying, modification, or distribution is strictly prohibited.
