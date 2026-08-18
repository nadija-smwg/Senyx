# 📚 Senyx ERP — Complete Learning Guide
> Learn everything built in this project, step by step, from scratch to production.

---

## Table of Contents

0. [Next.js Primer](#0-nextjs-primer)
00. [PostgreSQL Primer](#00-postgresql-primer)
1. [What Is Senyx?](#1-what-is-senyx)
2. [Project Setup & Tech Stack](#2-project-setup--tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Database Design with Drizzle ORM](#4-database-design-with-drizzle-orm)
5. [Authentication with Supabase](#5-authentication-with-supabase)
6. [Server-Side Middleware](#6-server-side-middleware)
7. [API Routes (REST)](#7-api-routes-rest)
8. [Server Services](#8-server-services)
9. [Frontend Pages & Routing](#9-frontend-pages--routing)
10. [UI Components](#10-ui-components)
11. [Custom React Hooks](#11-custom-react-hooks)
12. [Utilities & Helpers](#12-utilities--helpers)
13. [Testing (Unit + E2E)](#13-testing-unit--e2e)
14. [CI/CD with GitHub Actions](#14-cicd-with-github-actions)
15. [Database Backup to Cloudflare R2](#15-database-backup-to-cloudflare-r2)
16. [Deployment with Vercel](#16-deployment-with-vercel)

---

## 0. Next.js Primer

> **What is Next.js?** It's a framework built on top of React. React builds UI components; Next.js adds routing, server-side code, and API endpoints — so you can build a **full web app** in one project.

### The two environments Next.js runs in

```
┌─────────────────────────────────────────────┐
│  BROWSER (Client)          SERVER (Node.js) │
│  - Shows the UI            - Runs API routes │
│  - React components        - Reads database  │
│  - Hooks, state            - Sends emails    │
│  - useEffect, useState     - Handles auth    │
└─────────────────────────────────────────────┘
```

In Senyx, **one folder handles both**: `src/app/`.

### App Router — how URLs map to files

Next.js uses the **file system as your router**. The file path = the URL:

```
File                                      URL
────────────────────────────────────────────────────────────
src/app/page.tsx                      →  /
src/app/(dashboard)/hr/page.tsx       →  /hr
src/app/(dashboard)/hr/[id]/page.tsx  →  /hr/abc-123  (dynamic)
src/app/api/employees/route.ts        →  /api/employees  (API, no UI)
```

> **Note on `(folder)` names:** Parentheses mean the folder is for **organization only** — it does NOT appear in the URL. So `(dashboard)` is invisible in the browser.

### Special files Next.js looks for

| File | Purpose | Senyx Example |
|------|---------|---------------|
| `page.tsx` | The actual page UI | `(dashboard)/hr/page.tsx` |
| `layout.tsx` | Wraps child pages | Dashboard sidebar + header |
| `loading.tsx` | Shown while page loads | Spinner animation |
| `error.tsx` | Shown when page crashes | Error boundary UI |
| `not-found.tsx` | 404 page | Custom 404 |
| `route.ts` | API endpoint (no UI) | `/api/employees` |

### Server Components vs Client Components

This is the most important Next.js concept:

```tsx
// SERVER COMPONENT (default) — runs on the server only
// ✅ Can read the database directly
// ✅ Never sent to the browser (more secure)
// ❌ Cannot use useState, useEffect, onClick
export default async function HrPage() {
  const employees = await db.select().from(employees); // Direct DB call!
  return <EmployeeList data={employees} />;
}

// CLIENT COMPONENT — runs in the browser
// Add "use client" at the top
// ✅ Can use hooks, state, events
// ❌ Cannot read database directly
'use client';
export function SearchBar() {
  const [query, setQuery] = useState('');
  return <input onChange={e => setQuery(e.target.value)} />;
}
```

In Senyx, **pages are Server Components** that fetch data, and **interactive parts** (forms, buttons, modals) are Client Components.

### API Routes in Next.js

Create a file called `route.ts` anywhere under `src/app/api/` and export named functions for each HTTP method:

```typescript
// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Handles GET /api/employees
export async function GET(request: NextRequest) {
  return NextResponse.json({ data: [] });
}

// Handles POST /api/employees
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ data: body }, { status: 201 });
}

// Handles PUT /api/employees  ← same file, different export
export async function PUT(request: NextRequest) { ... }

// Handles DELETE /api/employees
export async function DELETE(request: NextRequest) { ... }
```

### `layout.tsx` — the root layout

Senyx's root layout (`src/app/layout.tsx`) sets up things every page needs:

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {children}       {/* ← every page renders here */}
        <Toaster />      {/* ← toast notifications available everywhere */}
      </body>
    </html>
  );
}
```

Google Fonts (`Inter`, `Inter Tight`, `JetBrains Mono`) are loaded here and injected as CSS variables — so the entire app uses them without extra network requests.

### `next.config.ts` — build config

```typescript
const nextConfig = {
  output: 'standalone', // Bundle everything needed to run — good for Docker
};
```

`standalone` mode makes the production build self-contained. Vercel and Docker can run it without needing `node_modules/` present.

### How data flows in Senyx

```
Browser  →  fetch('/api/employees')  →  route.ts
                                           ↓
                                       withAuth()        ← verify login
                                           ↓
                                       requirePermission() ← check role
                                           ↓
                                       employeeService.list() ← business logic
                                           ↓
                                       db.select().from(employees) ← SQL query
                                           ↓
                                       NextResponse.json(data)   ← respond
```

---

## 00. PostgreSQL Primer

> **What is PostgreSQL?** A powerful open-source relational database. Think of it as a very smart Excel — multiple sheets (tables), each row is a record, columns are fields. Tables can reference each other.

### Core concepts used in Senyx

#### 1. Tables and Rows

```sql
-- A table is like a spreadsheet
employees
┌────────────┬────────────┬───────────┬──────────┐
│ id (UUID)  │ first_name │ last_name │ status   │
├────────────┼────────────┼───────────┼──────────┤
│ a1b2-...   │ John       │ Doe       │ active   │
│ c3d4-...   │ Jane       │ Smith     │ on_leave │
└────────────┴────────────┴───────────┴──────────┘
```

#### 2. UUID as Primary Key

Senyx uses `UUID` instead of `1, 2, 3...` auto-increments:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
-- e.g.: '550e8400-e29b-41d4-a716-446655440000'
```

**Why?** UUIDs are globally unique. Safe to generate on the client or server without coordination. Hard to guess (more secure than `id=1`, `id=2`).

#### 3. Foreign Keys — linking tables

```sql
-- employees.department_id → departments.id
-- This means: "the department_id value MUST exist in the departments table"
department_id UUID REFERENCES departments(id)
```

In Drizzle:
```typescript
departmentId: uuid('department_id').references(() => departments.id)
```

PostgreSQL **enforces** this — you can't add an employee with a department that doesn't exist.

#### 4. Constraints — data validation at DB level

Senyx uses `CHECK` constraints so the database itself rejects bad data, not just the app:

```sql
-- Status MUST be one of these four values
CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated'))

-- Salary can't be negative
CHECK (amount >= 0)

-- Leave days must be positive
CHECK (days > 0)
```

In Drizzle:
```typescript
check('status_check', sql`${table.status} IN ('active', 'on_leave')`)
```

#### 5. Indexes — making queries fast

Without an index, PostgreSQL scans every row to find matches (slow). An index is like a book's index page:

```sql
-- Without index: scan 100,000 employees to find by department ❌
-- With index: jump directly to department employees ✅
CREATE INDEX employees_department_idx ON employees(department_id);
```

Senyx adds indexes on every foreign key and every column used in WHERE filters.

#### 6. Partial Indexes — index only what matters

```sql
-- Only index active employees (deleted ones aren't queried often)
CREATE INDEX employees_active_idx ON employees(status)
WHERE deleted_at IS NULL;
```

Smaller index = faster queries.

#### 7. Soft Deletes — never lose data

Instead of `DELETE FROM employees WHERE id = ?`, Senyx does:

```sql
UPDATE employees SET deleted_at = NOW() WHERE id = ?;
```

Then every query adds `WHERE deleted_at IS NULL` to ignore deleted rows. This means:
- ✅ Data is never truly gone — can be recovered
- ✅ Audit trail is preserved
- ✅ Foreign keys don't break

The `withNotDeleted()` helper in `src/server/db/helpers.ts` does this automatically:
```typescript
export function withNotDeleted(table) {
  return isNull(table.deletedAt); // WHERE deleted_at IS NULL
}
```

#### 8. Transactions — all or nothing

When creating a new employee you might need to:
1. Insert into `employees`
2. Create a `user` account
3. Assign a `role`

If step 2 fails, step 1 should be **rolled back** — you don't want a dangling employee with no account. A **transaction** ensures all steps succeed or none do:

```typescript
// src/server/lib/with-transaction.ts
await withTransaction(async (tx) => {
  const employee = await tx.insert(employees).values(data);
  const user = await tx.insert(users).values({ employeeId: employee.id });
  await tx.insert(userRoles).values({ userId: user.id, roleId });
  // If ANY of these throw, ALL changes are rolled back
});
```

#### 9. Drizzle ORM — how Senyx connects to PostgreSQL

```typescript
// src/server/db/client.ts

// 1. Create a raw PostgreSQL connection
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // Required for Supabase connection pooling
  ssl: 'require', // Always use encrypted connection
});

// 2. Wrap it with Drizzle (adds type safety)
export const db = drizzle(client, { schema: { ...identity, ...hr, ...crm } });
```

#### 10. Common Drizzle query patterns used in Senyx

```typescript
import { db } from '@/server/db/client';
import { employees } from '@/server/db/schema/hr';
import { eq, and, isNull, like } from 'drizzle-orm';

// SELECT * FROM employees WHERE id = ? AND deleted_at IS NULL
const [employee] = await db
  .select()
  .from(employees)
  .where(and(eq(employees.id, id), isNull(employees.deletedAt)));

// INSERT INTO employees (...) VALUES (...) RETURNING *
const [newEmployee] = await db
  .insert(employees)
  .values({ firstName: 'John', ... })
  .returning();

// UPDATE employees SET status = ? WHERE id = ?
await db
  .update(employees)
  .set({ status: 'on_leave' })
  .where(eq(employees.id, id));

// JOIN: get employees with their department name
const result = await db
  .select({ name: employees.firstName, dept: departments.name })
  .from(employees)
  .innerJoin(departments, eq(employees.departmentId, departments.id));
```

#### 11. Migrations — tracking schema changes over time

Every time you change a table, you generate a **migration file** — a snapshot of what changed:

```bash
# After editing any schema/*.ts file:
npm run db:generate     # Creates a new .sql file in src/server/db/migrations/
npm run db:migrate      # Runs all pending migrations against the database
```

Migration files look like:
```sql
-- 0001_create_employees.sql  (auto-generated, don't edit manually)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(60) NOT NULL,
  ...
);
```

This way the database schema evolves safely and every environment (dev, staging, production) stays in sync.

---

## 1. What Is Senyx?

**Senyx** is a full **ERP (Enterprise Resource Planning)** web application. Think of it like an all-in-one company management tool with:

| Module | What it does |
|--------|-------------|
| 👥 **HR** | Manage employees, departments, leaves, payroll |
| 💼 **CRM** | Track client companies, contacts, interactions |
| 💰 **Sales** | Manage deals and quotes |
| 📁 **Projects** | Kanban boards, tasks, milestones, time tracking |
| 🧾 **Finance** | Invoices, expenses, payments, subscriptions |
| 📊 **Analytics** | Business charts and reports |
| 🔔 **Notifications** | In-app and email alerts |
| 🔐 **RBAC** | Role-based access control |

**Tech Stack in simple words:**
- **Next.js** = The web framework (handles both frontend pages and backend API)
- **Supabase** = Manages user login/authentication
- **PostgreSQL** = The database where all data lives
- **Drizzle ORM** = How we talk to PostgreSQL using TypeScript
- **Tailwind CSS** = Makes everything look good
- **Vercel** = Where the app runs in production

---

## 2. Project Setup & Tech Stack

### How to start the project

```bash
# 1. Install all dependencies
npm install

# 2. Copy the environment file and fill it in
cp .env.example .env.local

# 3. Push the database schema to PostgreSQL
npm run db:push

# 4. Seed the database with sample data
npm run db:seed

# 5. Start the development server
npm run dev
```

### Key scripts in `package.json`

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code style
npm run type-check   # Check TypeScript errors
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end browser tests
npm run db:generate  # Generate database migration files
npm run db:push      # Apply schema to database
npm run db:studio    # Open visual database browser
npm run db:seed      # Fill database with demo data
```

### Key dependencies explained

| Package | What it does |
|---------|-------------|
| `next` | The web framework |
| `drizzle-orm` | Database queries in TypeScript |
| `@supabase/ssr` | Login/authentication |
| `zod` | Validates data shapes |
| `react-hook-form` | Handles form state |
| `recharts` | Charts and graphs |
| `@tanstack/react-table` | Data tables with sorting/filtering |
| `@dnd-kit/*` | Drag and drop (Kanban board) |
| `swr` | Fetches data and caches it |
| `pdfmake` | Generate PDF files |
| `resend` | Send emails |
| `pino` | Structured logging |
| `sonner` | Toast notifications (pop-up messages) |
| `lucide-react` | Icons |

---

## 3. Folder Structure

```
senyx/
├── src/
│   ├── app/                   ← Next.js pages and API routes
│   │   ├── (auth)/            ← Login, Register, Forgot Password pages
│   │   ├── (dashboard)/       ← All dashboard pages (HR, CRM, etc.)
│   │   └── api/               ← REST API endpoints
│   │
│   ├── components/            ← Reusable UI pieces
│   │   ├── ui/                ← Generic buttons, inputs, modals
│   │   ├── layout/            ← Sidebar, header, navigation
│   │   ├── hr/                ← HR-specific components
│   │   ├── crm/               ← CRM-specific components
│   │   ├── projects/          ← Project board components
│   │   ├── finance/           ← Invoice/payment components
│   │   └── charts/            ← Chart components
│   │
│   ├── hooks/                 ← Custom React hooks
│   ├── lib/                   ← Client-side utilities
│   ├── providers/             ← React context providers
│   │
│   └── server/                ← Backend-only code
│       ├── db/                ← Database schema and client
│       │   ├── schema/        ← Table definitions (the database map)
│       │   ├── migrations/    ← Database change history
│       │   └── seed.ts        ← Demo data generator
│       ├── services/          ← Business logic
│       ├── middleware/        ← Auth, RBAC, validation guards
│       ├── lib/               ← Server utilities (crypto, email, etc.)
│       └── types/             ← TypeScript type definitions
│
├── e2e/                       ← End-to-end browser tests
├── .github/workflows/         ← CI/CD automation
└── vercel.json                ← Deployment config
```

### 💡 Key Concept: Route Groups
The `(auth)` and `(dashboard)` folders use **parentheses**. In Next.js this means the folder name is just for organization — it does **not** appear in the URL. So `(dashboard)/hr/page.tsx` maps to the URL `/hr`.

---

## 4. Database Design with Drizzle ORM

### What is Drizzle ORM?

Instead of writing raw SQL like:
```sql
CREATE TABLE employees (id UUID PRIMARY KEY, name VARCHAR(60));
```

You write TypeScript:
```typescript
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 60 }).notNull(),
});
```

Drizzle then generates the SQL for you. This gives you **type safety** — TypeScript knows the shape of your data.

### How the schema is organized

The database is split across multiple files in `src/server/db/schema/`:

```
schema/
├── base.ts       ← Shared columns (createdAt, updatedAt, deletedAt)
├── identity.ts   ← users, roles, permissions, sessions
├── hr.ts         ← departments, employees, leave, payroll
├── crm.ts        ← accounts, contacts, interactions
├── sales.ts      ← deals, quotes
├── projects.ts   ← projects, tasks, milestones, time entries
├── finance.ts    ← invoices, expenses, payments, subscriptions
├── platform.ts   ← audit_logs, notifications, settings
└── core.ts       ← documents (file uploads)
```

### The `base.ts` pattern — Shared columns

Every table inherits these columns:

```typescript
// src/server/db/schema/base.ts
export const baseColumns = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // NULL = not deleted (soft delete)
};
```

**Why `deletedAt`?** Instead of actually deleting records, we just set `deletedAt` to the current time. This is called **soft delete** — the data is still in the database but treated as deleted. You can always restore it.

### Example: The `employees` table

```typescript
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),  // Auto-generate a unique ID
  employeeCode: varchar('employee_code', { length: 20 }).notNull().unique(), // e.g. EMP-001
  firstName: varchar('first_name', { length: 60 }).notNull(),
  salary: text('salary'),  // Stored encrypted! Not plain text.
  status: varchar('status', { length: 15 }).default('active').notNull(),
  managerId: uuid('manager_id').references((): AnyPgColumn => employees.id), // Self-reference!
  ...baseColumns,
}, (table) => [
  // Constraint: status must be one of these values
  check('status_check', sql`${table.status} IN ('active', 'on_leave', 'suspended', 'terminated')`),
  // Index for fast lookup by department
  index('employees_department_idx').on(table.departmentId),
]);
```

**What you learn here:**
- `uuid().primaryKey().defaultRandom()` = auto-generated unique ID
- `.notNull()` = field is required
- `.references()` = this field points to another table (foreign key)
- Self-referencing: `managerId` points back to `employees` itself — a manager is also an employee!
- `check()` = database-level validation — the database itself rejects bad data
- `index()` = makes queries faster on that column

### Important schemas to study

#### `identity.ts` — Roles & Permissions (RBAC)
```typescript
// Users have roles, roles have permissions
users → user_roles → roles → role_permissions → permissions
```
This is a classic **Role-Based Access Control** pattern.

#### `projects.ts` — Kanban Board
```typescript
projects
  └── board_columns  (To Do, In Progress, Done...)
        └── tasks    (individual work items)
                └── time_entries (how long each task took)
```

#### `platform.ts` — Audit Logs
Every action (create, update, delete) is recorded in `audit_logs` with who did it, from what IP, before/after state.

### Running database commands

```bash
# After changing any schema file, generate a migration:
npm run db:generate

# Apply all pending migrations to your database:
npm run db:migrate

# Or just push directly (faster for development):
npm run db:push

# Open a visual UI to browse your database:
npm run db:studio
```

---

## 5. Authentication with Supabase

### What is Supabase?

Supabase handles the complex parts of user login:
- Password hashing and storage
- Session management (keeping users logged in)
- Password reset emails
- JWT tokens

Your app talks to Supabase to verify "is this person who they say they are?"

### Auth pages in `src/app/(auth)/`

| File | Page |
|------|------|
| `login/page.tsx` | `/login` — email & password form |
| `register/page.tsx` | `/register` — create account |
| `forgot-password/page.tsx` | `/forgot-password` — request reset link |
| `reset-password/page.tsx` | `/reset-password` — set new password |

### How login works (step by step)

```
User fills form → Client sends to Supabase → Supabase validates
    → Returns JWT token → Token stored in cookie
    → Future requests include cookie → Server verifies token
```

### The `useAuth` hook

```typescript
// src/hooks/use-auth.ts
// Use this in any component to get the current user
const { user, isLoading, signOut } = useAuth();
```

### How the server verifies the token

```typescript
// src/server/middleware/auth.ts
export async function withAuth(request: NextRequest): Promise<AuthContext> {
  const supabase = createServerClient(/* ... */);
  
  // Ask Supabase: "Is this token valid?"
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new UnauthorizedError('Authentication required');
  
  // Then load their roles & permissions from our own database
  const userRolesData = await db.select()...
  
  return { userId, roles, permissions, ... };
}
```

**Key insight:** Supabase handles "is this user real?" and our database handles "what can this user do?"

---

## 6. Server-Side Middleware

Middleware are functions that run **before** your API handler. Think of them as security guards.

### Files in `src/server/middleware/`

| File | What it does |
|------|-------------|
| `auth.ts` | Verifies the user is logged in |
| `rbac.ts` | Checks if user has permission to do this action |
| `validate.ts` | Validates the request body shape using Zod |
| `error-handler.ts` | Catches errors and returns proper HTTP responses |

### How they chain together

```typescript
// In an API route handler:
export async function POST(request: NextRequest) {
  // Step 1: Is user logged in?
  const auth = await withAuth(request);
  
  // Step 2: Does user have 'create' permission for 'employees'?
  requirePermission(auth, 'employees', 'create');
  
  // Step 3: Is the request body valid?
  const body = await validateBody(request, createEmployeeSchema);
  
  // Step 4: Do the actual work
  const employee = await employeeService.create(body, auth);
}
```

### RBAC (Role-Based Access Control)

```typescript
// src/server/middleware/rbac.ts
// This checks: does this user's role have permission to do this?
requirePermission(authContext, module, action);
// Example:
requirePermission(auth, 'hr', 'delete'); // Can user delete HR records?
```

**Permissions have 3 parts:**
- **module**: `'hr'`, `'crm'`, `'finance'`, etc.
- **action**: `'view'`, `'create'`, `'edit'`, `'delete'`, `'approve'`, `'export'`
- **scope**: `'all'` (see everything), `'own'` (only their own records), `'assigned'` (only assigned to them)

---

## 7. API Routes (REST)

All API endpoints live in `src/app/api/`. Next.js automatically makes these available at `/api/...`.

### The pattern every API route follows

```typescript
// src/app/api/employees/route.ts
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { employeeService } from '@/server/services/employee.service';
import { withAudit } from '@/server/lib/with-audit';

// GET /api/employees — list all employees
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    requirePermission(auth, 'hr', 'view');
    
    const employees = await employeeService.list(/* filters */);
    return NextResponse.json({ data: employees });
  } catch (error) {
    return handleError(error); // Converts errors to proper HTTP responses
  }
}

// POST /api/employees — create new employee
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    requirePermission(auth, 'hr', 'create');
    
    const body = await request.json();
    const employee = await employeeService.create(body, auth);
    
    return NextResponse.json({ data: employee }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

### All available API endpoints

| Area | Endpoints |
|------|----------|
| **Auth** | `/api/auth/...` |
| **Employees** | `/api/employees`, `/api/employees/[id]` |
| **HR** | `/api/departments`, `/api/designations`, `/api/leave-requests`, `/api/payroll`, `/api/skills` |
| **CRM** | `/api/accounts`, `/api/contacts`, `/api/interactions`, `/api/activities` |
| **Sales** | `/api/deals`, `/api/quotes` |
| **Projects** | `/api/projects`, `/api/tasks`, `/api/milestones` |
| **Finance** | `/api/invoices`, `/api/expenses`, `/api/payments`, `/api/subscriptions` |
| **Time** | `/api/clock`, `/api/clock-sessions` |
| **Platform** | `/api/notifications`, `/api/audit-logs`, `/api/settings`, `/api/reports`, `/api/analytics` |
| **RBAC** | `/api/roles`, `/api/permissions` |
| **Files** | `/api/documents` |

---

## 8. Server Services

Services contain the **business logic** — the actual work that needs to happen. They're separate from the API routes so the logic can be tested and reused.

### Files in `src/server/services/`

| Service | What it handles |
|---------|----------------|
| `auth.service.ts` | Login, logout, password reset |
| `employee.service.ts` | CRUD for employees, org chart |
| `crm.service.ts` | Accounts, contacts, interactions |
| `deal.service.ts` | Sales pipeline, deal stages |
| `project.service.ts` | Projects, board columns |
| `task.service.ts` | Kanban tasks, drag-drop reorder |
| `milestone.service.ts` | Project milestones |
| `finance.service.ts` | Invoices, calculations |
| `expense.service.ts` | Expense tracking, approvals |
| `payment.service.ts` | Recording payments |
| `leave.service.ts` | Leave requests, balance deductions |
| `time.service.ts` | Clock in/out, time entry |
| `analytics.service.ts` | Dashboard KPIs and charts |
| `report.service.ts` | Generate reports as PDF/CSV |
| `notification.service.ts` | Create and send notifications |
| `rbac.service.ts` | Manage roles and permissions |

### Example: How a service works

```typescript
// src/server/services/employee.service.ts

export const employeeService = {
  // List employees with filters
  async list(filters: { departmentId?: string; status?: string }) {
    return db.select()
      .from(employees)
      .where(and(
        filters.departmentId ? eq(employees.departmentId, filters.departmentId) : undefined,
        isNull(employees.deletedAt), // Only non-deleted
      ));
  },
  
  // Create a new employee
  async create(data: CreateEmployeeDto, auth: AuthContext) {
    const [employee] = await db.insert(employees).values({
      ...data,
      salary: encrypt(data.salary), // Encrypt sensitive data!
    }).returning();
    
    return employee;
  },
};
```

### Encryption for sensitive fields

Salary, bank details, and national IDs are stored encrypted in the database. Even if someone dumps the database, they can't read salaries.

```typescript
// src/server/lib/crypto.ts
const encrypt = (text: string): string => { /* AES encryption */ };
const decrypt = (encrypted: string): string => { /* AES decryption */ };
```

### Audit logging with `withAudit`

```typescript
// src/server/lib/with-audit.ts
// Wrap any database operation to auto-log it
await withAudit(auth, 'UPDATE', 'employee', employeeId, async () => {
  return db.update(employees).set(data).where(eq(employees.id, employeeId));
});
// This records: who did it, when, what changed (before vs after)
```

---

## 9. Frontend Pages & Routing

### How Next.js App Router works

Every `page.tsx` file inside `src/app/` becomes a URL:

```
src/app/(dashboard)/hr/page.tsx        → /hr
src/app/(dashboard)/hr/[id]/page.tsx   → /hr/123 (dynamic ID)
src/app/(dashboard)/projects/page.tsx  → /projects
src/app/api/employees/route.ts         → /api/employees (API, not a page)
```

### Dashboard pages

| Page | URL | What you see |
|------|-----|-------------|
| Dashboard Home | `/` | KPI cards, recent activity |
| HR | `/hr` | Employee list, departments |
| CRM | `/crm` | Client accounts |
| Projects | `/projects` | Project list, Kanban board |
| Finance | `/finance` | Invoices, expenses |
| Sales | `/sales` | Deals pipeline |
| Analytics | `/analytics` | Charts and graphs |
| Audit | `/audit` | Activity log |
| Settings | `/settings` | App configuration |
| Notifications | `/notifications` | Alerts center |

### The dashboard layout

```typescript
// src/app/(dashboard)/layout.tsx
// This wraps every dashboard page with the sidebar and header
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />          {/* Left navigation */}
      <div className="flex-1">
        <Header />         {/* Top bar */}
        <main>{children}</main>  {/* The actual page */}
      </div>
    </div>
  );
}
```

### Special app files

| File | Purpose |
|------|---------|
| `layout.tsx` | Wraps every page (fonts, providers, etc.) |
| `loading.tsx` | Shows a spinner while page loads |
| `error.tsx` | Shows when something crashes |
| `not-found.tsx` | The 404 page |
| `globals.css` | Global CSS styles |

---

## 10. UI Components

Components are reusable pieces of UI. Instead of writing the same button 50 times, you write it once as a component and reuse it.

### Component categories

```
src/components/
├── ui/          ← Generic: Button, Input, Modal, Table, Badge
├── layout/      ← Sidebar, Header, Breadcrumb
├── shared/      ← Used across multiple modules
├── hr/          ← EmployeeCard, LeaveRequestForm
├── crm/         ← AccountDetails, ContactList
├── projects/    ← KanbanBoard, TaskCard, MilestoneList
├── finance/     ← InvoiceForm, ExpenseList
├── sales/       ← DealPipeline, QuoteBuilder
├── charts/      ← RevenueChart, EmployeeGrowthChart
├── clock/       ← ClockInButton, TimeTracker
├── board/       ← Kanban drag-and-drop board
├── data/        ← DataTable component
└── settings/    ← Settings forms
```

### How to use a UI component

```tsx
// Import and use it anywhere
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function EmployeeCard({ employee }) {
  return (
    <div>
      <h2>{employee.firstName} {employee.lastName}</h2>
      <Badge variant={employee.status === 'active' ? 'success' : 'warning'}>
        {employee.status}
      </Badge>
      <Button onClick={() => editEmployee(employee.id)}>
        Edit
      </Button>
    </div>
  );
}
```

### The Kanban Board (Drag & Drop)

The project board uses `@dnd-kit` for drag and drop:
```
BoardColumn (To Do) ← drag tasks between columns →  BoardColumn (Done)
    TaskCard                                             TaskCard
    TaskCard
```

When you drag a task card, it calls the API to update the task's `columnId` and `position` in the database.

---

## 11. Custom React Hooks

Hooks are reusable pieces of logic. Instead of writing the same `fetch` call everywhere, you put it in a hook.

### Available hooks in `src/hooks/`

#### `useAuth` — Current logged-in user
```typescript
const { user, isLoading, signOut } = useAuth();

if (isLoading) return <Spinner />;
if (!user) return <LoginPrompt />;
return <Dashboard user={user} />;
```

#### `usePermissions` — Check what the user can do
```typescript
const { can } = usePermissions();

// Show the delete button only if user has permission
{can('hr', 'delete') && <DeleteButton />}
```

#### `useNotifications` — Real-time notifications
```typescript
const { notifications, unreadCount, markAsRead } = useNotifications();
```

#### `useClock` — Time tracking (Clock in/out)
```typescript
const { isClocked, clockIn, clockOut, elapsedTime } = useClock();

// Show the timer if user is clocked in
{isClocked && <Timer elapsed={elapsedTime} />}
```

### How hooks typically work with `SWR`

`SWR` is used to fetch data, cache it, and auto-refresh:

```typescript
import useSWR from 'swr';

function useEmployees() {
  const { data, error, isLoading } = useSWR('/api/employees');
  return { employees: data?.data, error, isLoading };
}
```

---

## 12. Utilities & Helpers

### `src/lib/api-client.ts` — Client-side fetch wrapper

Instead of repeating `fetch('/api/...')` everywhere, there's a helper:

```typescript
import { apiClient } from '@/lib/api-client';

// GET
const employees = await apiClient.get('/employees');

// POST
const newEmployee = await apiClient.post('/employees', { firstName: 'John', ... });
```

### `src/lib/utils.ts` — Tailwind class merger

```typescript
import { cn } from '@/lib/utils';

// Merge Tailwind classes safely (handles conflicts)
<div className={cn('text-blue-500', isActive && 'font-bold')} />
```

### Server-side utilities in `src/server/lib/`

| File | What it does |
|------|-------------|
| `crypto.ts` | Encrypts/decrypts sensitive fields (salary, bank details) |
| `email-provider.ts` | Sends emails via **Resend** |
| `r2-client.ts` | Uploads/downloads files to **Cloudflare R2** (like S3) |
| `code-generator.ts` | Generates codes like `EMP-001`, `PRJ-007` |
| `filter-parser.ts` | Parses URL query params into database filters |
| `user-agent-parser.ts` | Detects browser/OS from request headers |
| `with-audit.ts` | Wraps DB operations with audit logging |
| `with-transaction.ts` | Runs multiple DB operations as one atomic unit |
| `logger.ts` | Structured logging with **Pino** |
| `supabase-admin.ts` | Admin-level Supabase client (for server use) |

### Encryption example

```typescript
// The salary is never stored as plain text
// In database: "U2FsdGVkX1+abc123..." (encrypted gibberish)
// In memory: "75000" (decrypted when you read it)

const salary = encrypt("75000");  // Stores to DB
const plain = decrypt(salary);    // Reads from DB
```

### File uploads with R2

```typescript
// src/server/lib/r2-client.ts
// Upload a file
const { key } = await uploadToR2(file, 'documents/');

// Get a temporary URL to download/view the file
const url = await getPresignedUrl(key);
```

---

## 13. Testing (Unit + E2E)

### Unit Tests with Vitest

Vitest tests individual functions and services in isolation.

```bash
npm run test           # Watch mode (re-runs on changes)
npm run test:run       # Run once
npm run test:coverage  # Run and show coverage report
```

**What to test:** Service functions, utilities, validation schemas.

### E2E Tests with Playwright

Playwright controls a real browser and tests the entire flow.

```bash
npm run test:e2e       # Run headless (no browser window)
npm run test:e2e:ui    # Open Playwright's visual test runner
```

### The auth E2E test

```typescript
// e2e/auth.spec.ts
test('should login successfully', async ({ page }) => {
  // 1. Open the login page in the browser
  await page.goto('/login');
  
  // 2. Check the page loaded
  await expect(page.locator('text=Welcome back')).toBeVisible();
  
  // 3. Fill in the form
  await page.fill('input[type="email"]', 'admin@senyx.com');
  await page.fill('input[type="password"]', 'password123');
  
  // 4. Click submit
  await page.click('button[type="submit"]');
  
  // 5. Verify we left the login page (= success!)
  await expect(page).not.toHaveURL('/login', { timeout: 10000 });
});
```

### Playwright config (`playwright.config.ts`)

Defines the base URL, browsers to test on, and test timeouts.

---

## 14. CI/CD with GitHub Actions

CI/CD = **Continuous Integration / Continuous Deployment**. Every time you push code, GitHub automatically runs checks.

### Workflows in `.github/workflows/`

| File | When it runs | What it does |
|------|-------------|--------------|
| `ci.yml` | Every push/PR | Type check, lint, tests, build |
| `deploy.yml` | Push to `main` | Deploy to production |
| `deploy-staging.yml` | Push to `dev` | Deploy to staging |
| `db-backup.yml` | Every day at 2 AM | Backup database to R2 |

### The CI Pipeline (`ci.yml`) step by step

```
Push code to GitHub
    ↓
Job 1: Code Quality
    → TypeScript check (no type errors?)
    → ESLint (code style?)
    → Prettier (formatting?)
    ↓ (if quality passes)
Job 2: Tests
    → Spin up PostgreSQL database
    → Run test suite
    → Upload coverage report
Job 3: Build
    → Build Next.js for production
    → Fails if build breaks
Job 4: Security
    → Check for vulnerable npm packages
```

### Concurrency control

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

This means: if you push twice quickly, it **cancels** the first run and starts the new one. Saves time and resources.

### GitHub Secrets

Sensitive values like database passwords are stored as **GitHub Secrets** (not in the code):
- `SUPABASE_URL` — your Supabase project URL
- `DATABASE_URL` — PostgreSQL connection string
- `ENCRYPTION_KEY` — for encrypting salary data
- `R2_ACCESS_KEY_ID` — for Cloudflare R2 backups

---

## 15. Database Backup to Cloudflare R2

### How it works

Every night at 2:00 AM UTC, GitHub Actions:

1. **Installs PostgreSQL tools** (`pg_dump`)
2. **Installs MinIO client** (`mc`) — a tool for talking to S3-compatible storage
3. **Dumps the database** to a compressed file
4. **Uploads it to Cloudflare R2** (cheap cloud object storage, like S3)
5. **Alerts on failure** via webhook (Slack/Discord)

```yaml
# The dump command:
pg_dump -h $DB_HOST -U postgres -d senyx_erp -F c -Z 9 > backup.dump
# -F c = custom format (compressed)
# -Z 9 = maximum compression

# The upload command:
mc cp backup.dump r2/your-bucket-name/backup.dump
```

### Restoring from a backup

```bash
pg_restore -h localhost -U postgres -d senyx_erp backup.dump
```

---

## 16. Deployment with Vercel

### `vercel.json` configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "regions": ["sin1"]  // Singapore region
}
```

### How deployment works

1. Push code to `main` branch
2. GitHub Action runs CI checks
3. If all checks pass → Vercel automatically deploys
4. Your app is live at your Vercel URL

### Environment variables on Vercel

Set these in your Vercel project dashboard:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `R2_*` variables

---

## 🗺️ Learning Path (Suggested Order)

If you want to understand the codebase from bottom to top:

```
1. Start here → src/server/db/schema/base.ts
2. Then       → src/server/db/schema/hr.ts
3. Then       → src/server/db/schema/identity.ts
4. Then       → src/server/middleware/auth.ts
5. Then       → src/server/services/employee.service.ts
6. Then       → src/app/api/employees/route.ts
7. Then       → src/hooks/use-auth.ts
8. Then       → src/app/(dashboard)/hr/page.tsx
9. Then       → .github/workflows/ci.yml
10. Finally   → e2e/auth.spec.ts
```

## 🎯 Key Concepts Summary

| Concept | Where to find it |
|---------|-----------------|
| Database schema | `src/server/db/schema/` |
| Business logic | `src/server/services/` |
| API endpoints | `src/app/api/` |
| Auth guard | `src/server/middleware/auth.ts` |
| Permission check | `src/server/middleware/rbac.ts` |
| Pages/UI | `src/app/(dashboard)/` |
| Reusable components | `src/components/` |
| Custom hooks | `src/hooks/` |
| Encryption | `src/server/lib/crypto.ts` |
| Audit logging | `src/server/lib/with-audit.ts` |
| File uploads | `src/server/lib/r2-client.ts` |
| CI/CD | `.github/workflows/ci.yml` |
| E2E tests | `e2e/auth.spec.ts` |
| Deployment | `vercel.json` |
