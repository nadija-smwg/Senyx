# Phase 1: Foundation Learning Guide

This document is designed to help you understand exactly what we built during Phase 1. We established the entire backend foundation (Database, Auth, Role-Based Access Control, Auditing) and the frontend shell (Design System, UI Components, Layouts).

Here is a breakdown of the core concepts and how they were implemented in this project.

---

## 1. Database & ORM (Drizzle)

We used **Drizzle ORM** to define our database schema using TypeScript. This gives us end-to-end type safety from the database to the frontend.

### The Identity Schema (`src/server/db/schema/identity.ts`)
Instead of writing raw `CREATE TABLE` SQL statements, we define tables like this:
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  // ...
});
```
**Why we did this:** When you query `db.select().from(users)`, TypeScript instantly knows that `isActive` is a boolean. You get auto-completion and compile-time error checking. 

### Database Migrations (`src/server/db/migrations/`)
For advanced database features like **Triggers** and **Row Level Security (RLS)**, we wrote raw SQL (`0001_triggers.sql`, `0002_rls.sql`).
- **Triggers**: We created a PostgreSQL trigger `prevent_audit_modification()` that automatically intercepts any `UPDATE` or `DELETE` command aimed at the `audit_logs` table and throws an error. This guarantees our audit logs are immutable (tamper-proof) at the database engine level.
- **RLS**: Row Level Security ensures that even if a backend developer makes a mistake and queries all sessions, PostgreSQL will filter the results *before* returning them, ensuring regular users only see their own sessions.

---

## 2. Core Middleware Architecture

Middleware intercepts incoming requests before they hit your API logic. We created several layers to enforce security.

### Auth Middleware (`src/server/middleware/auth.ts`)
The `withAuth` function takes the incoming Next.js request, reads the Supabase JWT token, and identifies the user. 
- It maps the user to their roles in our `user_roles` table.
- It extracts the user's IP Address and User-Agent (browser/OS info).
- It returns an `AuthContext` object. This object is passed down to all services so they know *exactly* who is making the request.

### RBAC Middleware (`src/server/middleware/rbac.ts`)
Once we know *who* the user is, we need to know *what* they can do. 
The `requirePermission('settings', 'view')` function checks the user's roles against the `permissions` table. If a user doesn't have the required permission, it immediately throws a `ForbiddenError` (HTTP 403), blocking the request before any data is read or written.

### The Audit Wrapper (`src/server/lib/with-audit.ts`)
This is the most critical function in the backend. 
Whenever a user modifies data (e.g., creates a role, updates settings), we wrap the database call in `withAudit(...)`.
```typescript
await withAudit(ctx, 'role.create', 'role', roleId, async (tx) => {
  // perform database insert using the 'tx' transaction object
});
```
**How it works:** It opens a database transaction. If the database insert succeeds, it automatically creates a record in the `audit_logs` table tracking *who* did it, *when*, from what *IP/Device*, and stores a JSON snapshot of the state `before` and `after`. If the transaction fails, it logs a "failure" audit record and rolls back the database insert.

---

## 3. The API Routes (Next.js App Router)

We exposed our backend logic using Next.js Route Handlers (`src/app/api/...`).

### Example: `/api/roles/route.ts`
When a `POST` request is sent to create a role:
1. **Auth & RBAC**: We run `const ctx = await withAuth(req)` and `requirePermission('settings', 'create')(ctx)`.
2. **Validation**: We use Zod (`validateBody`) to ensure the incoming JSON has a `name` string between 2 and 50 characters. If it doesn't, it automatically returns a 400 Bad Request.
3. **Execution**: We run the database insert wrapped in `withAudit`.
4. **Error Handling**: The entire block is wrapped in a `try/catch` that passes errors to `handleError(error)`. This ensures that if something breaks, the user gets a clean JSON error response, and the stack trace is securely logged to the server console via Pino.

---

## 4. Frontend Architecture (React & Tailwind)

We built a modern, component-based frontend shell.

### Tailwind & Global CSS (`src/app/globals.css`)
We used native CSS variables (e.g., `--color-primary`) mapped directly to Tailwind. This allows us to instantly switch themes (like Dark Mode) by just swapping the CSS variables under the `@media (prefers-color-scheme: dark)` block.

### UI Components (`src/components/ui/`)
Instead of copying and pasting long Tailwind class strings everywhere, we built reusable primitive components (Buttons, Inputs, Cards). 
- We used `class-variance-authority` (cva) in `button.tsx` to define variants (e.g., `variant="destructive"` or `size="sm"`). This keeps the design system strict and consistent.
- We used `Radix UI` for complex accessibility (like Labels and Avatars). Radix handles the ARIA attributes and keyboard navigation, while we just style it with Tailwind.

### Custom React Hooks (`src/hooks/`)
- **`useAuth()`**: This hook calls our `/api/auth/me` endpoint when the app loads. It stores the user's data, roles, and permissions in React state.
- **`usePermissions()`**: This hook provides a simple function `hasPermission('module', 'action')`. We can use this inside our React components to conditionally hide or show buttons depending on whether the user is allowed to click them.

### Layouts & Pages (`src/app/(dashboard)/`)
Next.js 14+ uses nested layouts. The `layout.tsx` file inside the `(dashboard)` folder acts as a wrapper. It contains the Sidebar and Topbar. Any page inside this folder (like `page.tsx` or `settings/page.tsx`) automatically renders *inside* this layout.
The layout also acts as an **Auth Guard**: it uses a `useEffect` hook to check if the user is logged in. If they aren't, it immediately redirects them to `/login` using `next/navigation`.

---

## Summary of the Flow

If a user logs in and tries to create a new Role, the data flows like this:
1. **React** (`useAuth` hook) sends email/password to `/api/auth/login`.
2. **Next.js Route** validates the credentials and issues an HTTP-only cookie containing the JWT.
3. User clicks "Create Role". React (`api-client.ts`) sends a POST to `/api/roles`.
4. **Backend `withAuth`** intercepts the request, reads the cookie, and confirms identity.
5. **Backend `requirePermission`** confirms the user is an Admin.
6. **Backend `withAudit`** opens a transaction, creates the role, creates the audit log, and commits.
7. **PostgreSQL** ensures `updated_at` is set via Triggers and verifies the user is authorized via RLS.
8. Response is returned to React, updating the UI!
