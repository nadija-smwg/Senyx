# Phase 2: HR & People Module — Learning Guide

This document breaks down the core concepts and technologies we implemented in Phase 2 of the SENYX ERP project. It is designed to help you learn exactly *how* the system works under the hood.

---

## 1. Database Schema Design (Drizzle ORM)
We used **Drizzle ORM** to construct the database schema in TypeScript. Instead of writing raw SQL `CREATE TABLE` commands, Drizzle allows us to define tables as TypeScript objects.

**Key Concepts Applied:**
- **Base Columns:** We used a reusable `baseColumns` object containing `created_at`, `updated_at`, and `deleted_at` to ensure every table has consistent audit and soft-delete fields.
- **Foreign Keys:** When creating relationships (like linking an `Employee` to a `Department`), we used the `.references()` method.
  ```typescript
  departmentId: uuid('department_id').references(() => departments.id)
  ```
- **Constraints & Indexes:** To ensure data integrity, we added `check` constraints (e.g., ensuring salaries are >= 0) and `index` blocks at the end of the table definitions.
  ```typescript
  check('salary_check', sql`${table.salary} >= 0`)
  ```

## 2. Server-Side Encryption (AES-256-GCM)
Because Human Resources involves sensitive data like Social Security Numbers and Bank Accounts, we implemented **Encryption at Rest** at the application level.

**How it works:**
- We built a utility in `src/server/lib/crypto.ts` using Node.js's native `crypto` module.
- We used `aes-256-gcm` (Advanced Encryption Standard, Galois/Counter Mode). It is an authenticated encryption algorithm, meaning it both encrypts the data and ensures it hasn't been tampered with (using an `authTag`).
- When creating an employee, the `employee.service.ts` converts the JSON payload to a string and passes it to `encrypt()`. Only the encrypted ciphertext is saved to Supabase.
- When HR loads the employee list, the service layer calls `decrypt()` before sending the data to the frontend.

## 3. The Service Layer & Audit Trails
To keep our API routes clean, we extracted the heavy business logic into **Services** (e.g., `employee.service.ts` and `leave.service.ts`). 

**The Audit System:**
We built a centralized `withAudit` tracking mechanism. Every time a Create, Update, or Delete operation occurs, the system logs:
- `actorId` (Who did it)
- `action` (e.g., `employee.create`)
- `entityId` (The ID of the affected record)
- `after` (A JSON snapshot of the new data)

In Phase 2, we injected `db.insert(auditLogs)` into the HR services so that every single leave request or employee addition creates an immutable trail of accountability.

## 4. API Routes & Zod Validation
Next.js App Router uses standard `route.ts` files for backend endpoints. 

**How our APIs function:**
1. **Middleware (`withAuth`):** Checks the user's Supabase Session cookie. If invalid, the request is rejected with a `401 Unauthorized`.
2. **Role-Based Access (RBAC):** We extract `ctx.roles` to determine if the user is an `Admin` or `HR Manager`. Standard employees can only fetch their `own` records, while HR can fetch `all`.
3. **Payload Validation (`zod`):** Before touching the database, the API passes `req.json()` into a Zod schema. Zod guarantees that emails are formatted correctly, strings aren't too long, and required fields aren't missing.

## 5. Frontend Technologies
The UI was built for maximum speed and beautiful aesthetics.

- **Shadcn UI / Radix UI:** We used unstyled, accessible primitives from Radix UI and wrapped them in Tailwind CSS using Shadcn. This includes elements like Dialogs, Dropdowns, and Select menus.
- **TanStack Table (React Table v8):** For the Employee list and Leave requests, we used a headless data table library. It manages the state for pagination, sorting, and filtering, while we provided the raw Tailwind HTML to render the table.
- **React Hook Form:** For the complex "Add Employee" form, we used `react-hook-form` paired with the `@hookform/resolvers/zod` package. This allows the frontend to use the exact same Zod validation schema as the backend!

---

### Summary of the Flow
1. User clicks "Add Employee" on the Frontend (React Hook Form).
2. Form data is POSTed to `/api/employees`.
3. Next.js API route checks `withAuth` and validates the JSON with `Zod`.
4. API calls `employee.service.ts`.
5. Service encrypts bank details using `crypto.ts`.
6. Service writes to the Database using `Drizzle ORM`.
7. Service writes an audit log to `audit_logs` tracking the creation.
8. API returns `201 Created` back to the Frontend.
