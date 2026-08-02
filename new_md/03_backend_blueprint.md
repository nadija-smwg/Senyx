# Backend Blueprint — SENYX ERP System

## 1. Technology Stack

| Concern | Choice | Notes |
|---|---|---|
| **Runtime** | Node.js (v20 LTS) | Long-term support, native ESM |
| **Framework** | Next.js App Router (v14+) | Route Handlers under `/app/api`, Server Actions |
| **Language** | TypeScript (strict mode) | Shared types between frontend and backend |
| **ORM** | Drizzle ORM | TypeScript-first, Supabase RLS compatible |
| **Database** | PostgreSQL 15+ (Supabase) | Relational, transactions, RLS |
| **Auth** | Supabase Auth | JWT-based, email/password + 2FA |
| **Validation** | Zod | Schema validation on every endpoint |
| **Email** | Resend (via `EmailProvider` interface) | Swappable email provider |
| **Object Storage** | Cloudflare R2 (S3-compatible SDK) | `@aws-sdk/client-s3` |
| **Scheduler** | Netlify Scheduled Functions / GitHub Actions cron | Reminders, reports, backups |
| **Logging** | Pino | Structured JSON logging |
| **Testing** | Vitest + Supertest | Unit + integration tests |

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
│                                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │         Route Handlers (/app/api/*)                │  │
│  │  authenticate → authorize → validate → execute     │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │              Service Layer                         │  │
│  │  Business logic, transactions, audit wrapping      │  │
│  │  withAudit() → operation → diff → audit_log        │  │
│  └────────────┬──────────────────┬────────────────────┘  │
│               │                  │                       │
│  ┌────────────▼──────┐  ┌───────▼────────────────────┐  │
│  │  Data Access Layer│  │  External Services          │  │
│  │  (Drizzle ORM)    │  │  ├─ R2 (documents)         │  │
│  │  (Supabase Client)│  │  ├─ Resend (email)         │  │
│  └────────────┬──────┘  │  └─ Scheduler (cron)       │  │
│               │         └────────────────────────────┘  │
│  ┌────────────▼──────────────────────────────────────┐  │
│  │           PostgreSQL (Supabase)                    │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │  │
│  │  │ Tables  │  │  RLS    │  │ Triggers/Funcs  │   │  │
│  │  └─────────┘  └─────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Backend Project Structure

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── me/route.ts
│       │   ├── 2fa/verify/route.ts
│       │   └── password/
│       │       ├── reset-request/route.ts
│       │       └── reset/route.ts
│       ├── sessions/
│       │   ├── route.ts                    # GET (list active sessions)
│       │   └── [id]/route.ts               # DELETE (force-terminate)
│       ├── roles/
│       │   ├── route.ts                    # GET (list), POST (create)
│       │   └── [id]/route.ts               # GET, PATCH, DELETE
│       ├── permissions/
│       │   └── route.ts                    # GET (catalogue)
│       ├── settings/
│       │   └── route.ts                    # GET, PATCH
│       ├── employees/
│       │   ├── route.ts                    # GET (list), POST (create — HR only)
│       │   └── [id]/
│       │       ├── route.ts                # GET, PATCH, DELETE (soft)
│       │       └── skills/route.ts         # POST (attach skill)
│       ├── designations/route.ts
│       ├── departments/route.ts
│       ├── skills/route.ts
│       ├── leave-types/route.ts
│       ├── leave-requests/
│       │   ├── route.ts                    # GET, POST
│       │   └── [id]/decision/route.ts      # POST (approve/reject)
│       ├── leave-balances/route.ts
│       ├── payroll/route.ts
│       ├── performance-reviews/route.ts
│       ├── accounts/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── contacts/route.ts
│       ├── interactions/route.ts
│       ├── activities/route.ts
│       ├── deals/
│       │   ├── route.ts                    # GET (scoped), POST (any employee)
│       │   └── [id]/
│       │       ├── route.ts                # GET, PATCH, DELETE
│       │       ├── stage/route.ts          # POST (change stage → history)
│       │       └── close/route.ts          # POST (win/loss → guided project)
│       ├── quotes/route.ts
│       ├── projects/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── board/route.ts          # GET (columns + tasks)
│       │       ├── columns/route.ts
│       │       ├── tasks/route.ts
│       │       ├── assignments/route.ts
│       │       ├── milestones/route.ts
│       │       ├── payment-milestones/route.ts
│       │       ├── time-entries/route.ts
│       │       ├── clock/
│       │       │   └── in/route.ts         # POST (clock in)
│       │       ├── risks/route.ts
│       │       └── summary/route.ts        # GET (owner dashboard data)
│       ├── tasks/
│       │   └── [id]/
│       │       ├── route.ts                # PATCH (update task)
│       │       └── move/route.ts           # POST (board move)
│       ├── milestones/
│       │   └── [id]/complete/route.ts      # POST (complete → payment due)
│       ├── clock/
│       │   └── out/route.ts                # POST (clock out)
│       ├── invoices/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── issue/route.ts          # POST (issue draft)
│       ├── expenses/
│       │   ├── route.ts
│       │   └── [id]/approve/route.ts
│       ├── payments/route.ts
│       ├── subscriptions/route.ts
│       ├── documents/
│       │   ├── route.ts                    # POST (upload)
│       │   └── [id]/route.ts               # GET (signed URL), DELETE
│       ├── notifications/
│       │   ├── route.ts                    # GET (user notifications)
│       │   └── [id]/read/route.ts
│       ├── analytics/
│       │   ├── dashboard/route.ts          # GET (scoped KPIs)
│       │   └── query/route.ts              # POST (structured query)
│       ├── reports/
│       │   └── [type]/route.ts             # GET (PDF/CSV export)
│       └── audit-logs/
│           ├── route.ts                    # GET (admin/auditor)
│           └── analytics/route.ts
│
├── server/
│   ├── middleware/
│   │   ├── auth.ts                         # JWT verification, user resolution
│   │   ├── rbac.ts                         # Permission check middleware
│   │   ├── audit.ts                        # Request context (device, IP, route)
│   │   ├── validate.ts                     # Zod validation wrapper
│   │   └── error-handler.ts               # Centralized error handling
│   │
│   ├── services/
│   │   ├── auth.service.ts                 # Login, logout, session management
│   │   ├── user.service.ts                 # User account CRUD
│   │   ├── rbac.service.ts                 # Role/permission management
│   │   ├── employee.service.ts             # HR people CRUD
│   │   ├── crm.service.ts                  # Accounts, contacts, interactions
│   │   ├── deal.service.ts                 # Deals, pipeline, stage changes
│   │   ├── project.service.ts              # Projects, assignments, board
│   │   ├── task.service.ts                 # Task CRUD, board moves
│   │   ├── time.service.ts                 # Time entries, clock sessions
│   │   ├── milestone.service.ts            # Delivery + payment milestones
│   │   ├── finance.service.ts              # Invoices, expenses, payments
│   │   ├── subscription.service.ts         # Recurring revenue
│   │   ├── document.service.ts             # R2 upload/download/delete
│   │   ├── notification.service.ts         # In-app + email dispatch
│   │   ├── reminder.service.ts             # Scheduled due-date emails
│   │   ├── analytics.service.ts            # Dashboard KPIs, queries
│   │   ├── report.service.ts               # Report generation
│   │   ├── audit.service.ts                # Audit log writes + queries
│   │   └── leave.service.ts                # Leave requests, balances
│   │
│   ├── db/
│   │   ├── schema/                         # Drizzle schema definitions
│   │   │   ├── identity.ts                 # users, roles, permissions, sessions
│   │   │   ├── hr.ts                       # employees, departments, designations, etc.
│   │   │   ├── crm.ts                      # accounts, contacts, interactions, etc.
│   │   │   ├── sales.ts                    # deals, deal_stage_history, quotes
│   │   │   ├── projects.ts                 # projects, tasks, board, time, milestones
│   │   │   ├── finance.ts                  # invoices, expenses, payments, subscriptions
│   │   │   ├── platform.ts                 # documents, notifications, audit_logs, etc.
│   │   │   └── index.ts                    # Re-export all schemas
│   │   ├── migrations/                     # Drizzle migration files
│   │   ├── seed.ts                         # Seed data (roles, permissions, settings)
│   │   ├── client.ts                       # Drizzle + Supabase client init
│   │   └── helpers.ts                      # Soft-delete filters, pagination helpers
│   │
│   ├── lib/
│   │   ├── with-audit.ts                   # Central audit wrapper
│   │   ├── with-transaction.ts             # Transaction wrapper
│   │   ├── email-provider.ts               # EmailProvider interface + Resend impl
│   │   ├── r2-client.ts                    # Cloudflare R2 client (S3-compatible)
│   │   ├── user-agent-parser.ts            # Parse device/browser/OS from UA
│   │   ├── crypto.ts                       # Encrypt/decrypt sensitive fields
│   │   ├── code-generator.ts              # Generate SNX-0001, PRJ-0007, INV-2026-0042
│   │   ├── filter-parser.ts               # Parse FilterNode → SQL
│   │   └── logger.ts                       # Pino structured logger
│   │
│   └── types/
│       ├── context.ts                      # Request context (user, session, device)
│       ├── errors.ts                       # Custom error classes
│       └── shared.ts                       # Shared enums + interfaces
│
└── scheduled/
    ├── due-date-reminders.ts               # Cron: email Project Owners about due dates
    ├── overdue-invoice-check.ts            # Cron: mark overdue invoices
    ├── scheduled-reports.ts                # Cron: generate & deliver reports
    └── database-backup.ts                  # Cron: pg_dump → R2
```

---

## 4. Request Pipeline (Every API Call)

```
Request → 
  1. Auth Middleware       → Verify JWT, resolve user, roles, employee_id
  2. Request Context       → Extract device, browser, OS, IP, API route
  3. RBAC Check            → Verify user has permission (module, action, scope)
  4. Validation            → Zod parse request body/params/query
  5. Service Layer         → Business logic execution
     └─ withAudit()        → Begin transaction
        ├─ Read "before" state (for updates)
        ├─ Execute operation
        ├─ Read "after" state
        ├─ Write audit_log entry
        └─ Commit transaction
  6. Response              → Standard envelope { data, meta, error }
```

### 4.1 Standard Response Envelope

```typescript
// Success response
{
  data: T | T[],
  meta: {
    page: number,
    pageSize: number,
    total: number
  }
}

// Error response
{
  error: {
    code: string,       // e.g. "VALIDATION_ERROR", "FORBIDDEN"
    message: string,
    details?: Record<string, string[]>  // field-level errors
  }
}
```

### 4.2 HTTP Status Codes

| Code | Usage |
|---|---|
| `200` | Successful GET, PATCH |
| `201` | Successful POST (created) |
| `204` | Successful DELETE |
| `400` | Validation error (Zod) |
| `401` | Unauthenticated (no/invalid JWT) |
| `403` | Unauthorized (RBAC denied) |
| `404` | Not found (or soft-deleted) |
| `409` | Conflict (e.g. duplicate unique) |
| `422` | Business rule violation |
| `500` | Internal server error |

---

## 5. Core Backend Patterns

### 5.1 Auth Middleware

```typescript
// server/middleware/auth.ts
export async function withAuth(request: NextRequest): Promise<AuthContext> {
  const supabase = createServerClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user) throw new UnauthorizedError();
  
  // Resolve app user, employee, roles, permissions
  const appUser = await getUserWithRoles(user.id);
  if (!appUser.isActive) throw new UnauthorizedError('Account deactivated');
  
  return {
    userId: appUser.id,
    employeeId: appUser.employeeId,
    roles: appUser.roles,
    permissions: appUser.permissions,
    sessionId: extractSessionId(request),
    device: parseUserAgent(request.headers.get('user-agent')),
    ip: request.headers.get('x-forwarded-for'),
    apiRoute: `${request.method} ${request.nextUrl.pathname}`,
  };
}
```

### 5.2 RBAC Check

```typescript
// server/middleware/rbac.ts
export function requirePermission(
  module: string, 
  action: PermissionAction, 
  scope?: RecordScope
) {
  return (ctx: AuthContext) => {
    const perm = ctx.permissions.find(
      p => p.module === module && p.action === action
    );
    if (!perm) throw new ForbiddenError(`No ${action} access to ${module}`);
    return perm.scope; // Returns scope for data filtering
  };
}
```

### 5.3 Central Audit Wrapper

```typescript
// server/lib/with-audit.ts
export async function withAudit<T>(
  ctx: AuthContext,
  action: string,
  entityType: string,
  entityId: string | null,
  operation: (tx: Transaction) => Promise<{ result: T; before?: any; after?: any }>
): Promise<T> {
  return await db.transaction(async (tx) => {
    const { result, before, after } = await operation(tx);
    
    await tx.insert(auditLogs).values({
      actorId: ctx.userId,
      roleInEffect: ctx.roles[0]?.name ?? null,
      sessionId: ctx.sessionId,
      action,
      apiRoute: ctx.apiRoute,
      entityType,
      entityId,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
      device: ctx.device.device,
      os: ctx.device.os,
      browser: ctx.device.browser,
      ipAddress: ctx.ip,
      result: 'success',
    });
    
    return result;
  });
}
```

### 5.4 Route Handler Pattern

```typescript
// app/api/deals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { dealService } from '@/server/services/deal.service';
import { createDealSchema, listParamsSchema } from '@/server/types/shared';

export async function GET(request: NextRequest) {
  try {
    const ctx = await withAuth(request);
    const scope = requirePermission('sales', 'view')(ctx);
    const params = listParamsSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    
    const result = await dealService.list(ctx, scope, params);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await withAuth(request);
    requirePermission('sales', 'create')(ctx);
    const body = createDealSchema.parse(await request.json());
    
    const deal = await dealService.create(ctx, body);
    return NextResponse.json({ data: deal }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

### 5.5 Service Layer Pattern

```typescript
// server/services/deal.service.ts
export const dealService = {
  async create(ctx: AuthContext, input: CreateDealInput) {
    return withAudit(ctx, 'deal.create', 'deals', null, async (tx) => {
      const deal = await tx.insert(deals).values({
        ...input,
        ownerId: ctx.employeeId,  // Owner = creating employee
        status: 'open',
        stage: 'lead',
      }).returning();
      
      return { result: deal[0], after: deal[0] };
    });
  },

  async changeStage(ctx: AuthContext, dealId: string, newStage: DealStage) {
    return withAudit(ctx, 'deal.stage_change', 'deals', dealId, async (tx) => {
      const before = await tx.query.deals.findFirst({ where: eq(deals.id, dealId) });
      if (!before) throw new NotFoundError('Deal');
      
      // Record stage history
      await tx.insert(dealStageHistory).values({
        dealId,
        fromStage: before.stage,
        toStage: newStage,
        changedBy: ctx.userId,
      });
      
      // Update deal
      const after = await tx.update(deals)
        .set({ stage: newStage, updatedBy: ctx.userId })
        .where(eq(deals.id, dealId))
        .returning();
      
      return { result: after[0], before, after: after[0] };
    });
  },
};
```

### 5.6 Milestone → Invoice Flow

```typescript
// server/services/milestone.service.ts
async completeMilestone(ctx: AuthContext, milestoneId: string) {
  return withAudit(ctx, 'milestone.complete', 'milestones', milestoneId, async (tx) => {
    // 1. Mark delivery milestone completed
    const milestone = await tx.update(milestones).set({
      status: 'completed',
      completedAt: new Date(),
    }).where(eq(milestones.id, milestoneId)).returning();

    // 2. Find and mark corresponding payment milestone as "due"
    const paymentMilestone = await tx.update(paymentMilestones).set({
      status: 'due',
      completedAt: new Date(),
    }).where(/* matching phase */).returning();

    // 3. Create draft invoice (not auto-issued)
    if (paymentMilestone[0]) {
      const project = await tx.query.projects.findFirst({ where: eq(projects.id, paymentMilestone[0].projectId) });
      
      const invoice = await tx.insert(invoices).values({
        invoiceNumber: await generateInvoiceNumber(tx),
        accountId: project.accountId,
        projectId: project.id,
        paymentMilestoneId: paymentMilestone[0].id,
        subtotal: paymentMilestone[0].amount,
        tax: 0,
        total: paymentMilestone[0].amount,
        currency: paymentMilestone[0].currency,
        status: 'draft',
      }).returning();

      // Link invoice to payment milestone
      await tx.update(paymentMilestones).set({
        status: 'invoiced',
        invoiceId: invoice[0].id,
      }).where(eq(paymentMilestones.id, paymentMilestone[0].id));
    }

    return { result: milestone[0], after: milestone[0] };
  });
}
```

---

## 6. Sensitive Data Handling

### 6.1 Encryption at Rest

```typescript
// server/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(plaintext: string): string { /* ... */ }
export function decrypt(ciphertext: string): string { /* ... */ }
```

Applied to: `employees.salary`, `employees.bank_details`, `employees.national_id`, `payroll_records.gross/net`.

### 6.2 Column-Masking Views

```sql
-- PostgreSQL view for non-HR users
CREATE VIEW employees_public AS
SELECT id, employee_code, first_name, last_name, email, 
       designation_id, department_id, status
FROM employees
WHERE deleted_at IS NULL;
-- salary, bank_details, national_id excluded
```

---

## 7. External Service Integrations

### 7.1 Cloudflare R2 (Documents)

```typescript
// server/lib/r2-client.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadDocument(file: Buffer, key: string, mimeType: string) { /* ... */ }
export async function getSignedDownloadUrl(key: string, expiresIn = 3600) { /* ... */ }
export async function deleteDocument(key: string) { /* ... */ }
```

### 7.2 Resend (Email)

```typescript
// server/lib/email-provider.ts
export interface EmailProvider {
  send(input: { to: string; subject: string; html: string; text?: string }): Promise<{ id: string }>;
}

export class ResendProvider implements EmailProvider {
  private client = new Resend(process.env.RESEND_API_KEY);
  
  async send(input) {
    return this.client.emails.send({
      from: process.env.EMAIL_FROM!,
      ...input,
    });
  }
}
```

---

## 8. Scheduled Jobs

| Job | Schedule | Function |
|---|---|---|
| **Due-date reminders** | Daily at 08:00 + advance offsets (7d, 3d, 1d) | Email Project Owners about upcoming/overdue tasks, milestones, payment collections |
| **Overdue invoice check** | Daily at 00:00 | Mark invoices past `due_date` as `overdue` |
| **Scheduled reports** | Configurable per report | Generate PDF/CSV and deliver via email |
| **Database backup** | Daily at 02:00 | `pg_dump` → upload to R2 |
| **Session cleanup** | Hourly | End sessions past timeout threshold |

---

## 9. Error Handling

```typescript
// server/types/errors.ts
export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = 'Authentication required') { super(401, 'UNAUTHORIZED', msg); }
}

export class ForbiddenError extends AppError {
  constructor(msg = 'Insufficient permissions') { super(403, 'FORBIDDEN', msg); }
}

export class NotFoundError extends AppError {
  constructor(entity: string) { super(404, 'NOT_FOUND', `${entity} not found`); }
}

export class BusinessRuleError extends AppError {
  constructor(msg: string) { super(422, 'BUSINESS_RULE', msg); }
}

export class ConflictError extends AppError {
  constructor(msg: string) { super(409, 'CONFLICT', msg); }
}
```

---

## 10. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=senyx-erp-docs

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@senyx.io

# Security
ENCRYPTION_KEY=<64-char hex>

# App
NEXT_PUBLIC_APP_URL=https://erp.senyx.io
NODE_ENV=production
```

---

*This blueprint defines the backend architecture. See the Frontend Blueprint for UI layer and the Database Blueprint for schema details.*
