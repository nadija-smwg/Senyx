# Phase 1 — Foundation (Auth + RBAC + Audit + Core)

**Duration:** 2–3 weeks  
**Dependencies:** Phase 0 (CI/CD ready)  
**Tables:** 6 — `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions`  
**API Routes:** 16  
**Security:** Phase S items S.1, S.2, S.4.1, S.4.3, S.5.2, S.6.2 applied here  

---

## 1.1 Database Schema — Identity & RBAC

### Task 1.1.1 — Create Drizzle Schema: Identity

**File: `src/server/db/schema/identity.ts`**

```
- [ ] Define `users` table:
      id (uuid PK, matches Supabase auth.users.id)
      employee_id (uuid, NOT NULL, UNIQUE, FK → employees)
      email (citext, NOT NULL, UNIQUE)
      is_active (boolean, default true)
      two_factor_enabled (boolean, default false)
      last_login_at (timestamptz, nullable)
      + base columns (created_at, updated_at, deleted_at, created_by, updated_by)

- [ ] Define `roles` table:
      id (uuid PK)
      name (varchar(50), NOT NULL, UNIQUE)
      description (text, nullable)
      is_system (boolean, default false)
      + base columns

- [ ] Define `permissions` table:
      id (uuid PK)
      module (varchar(30), NOT NULL)
      action (varchar(20), NOT NULL, CHECK: view/create/edit/delete/export/approve)
      scope (varchar(10), NOT NULL, CHECK: all/own/assigned, default 'all')
      description (text, nullable)
      UNIQUE(module, action, scope)
      + base columns

- [ ] Define `role_permissions` join table:
      role_id (uuid, FK → roles, ON DELETE CASCADE)
      permission_id (uuid, FK → permissions, ON DELETE CASCADE)
      PK(role_id, permission_id)

- [ ] Define `user_roles` join table:
      user_id (uuid, FK → users, ON DELETE CASCADE)
      role_id (uuid, FK → roles, ON DELETE CASCADE)
      PK(user_id, role_id)

- [ ] Define `sessions` table (append-only):
      id (uuid PK)
      user_id (uuid, FK → users)
      started_at (timestamptz, default now())
      ended_at (timestamptz, nullable)
      duration_seconds (integer, nullable, CHECK >= 0)
      ip_address (inet, nullable)
      device (varchar(60), nullable)
      os (varchar(60), nullable)
      browser (varchar(60), nullable)
      user_agent (text, nullable)
      is_active (boolean, default true)
      created_at (timestamptz, default now())
```

### Task 1.1.2 — Create Drizzle Schema: Audit & Settings

**File: `src/server/db/schema/platform.ts`**

```
- [ ] Define `audit_logs` table (append-only, immutable):
      id (uuid PK)
      actor_id (uuid, nullable, FK → users)
      role_in_effect (varchar(50), nullable)
      session_id (uuid, nullable, FK → sessions)
      action (varchar(60), NOT NULL)
      api_route (varchar(160), NOT NULL)
      entity_type (varchar(40), nullable)
      entity_id (uuid, nullable)
      before (jsonb, nullable)
      after (jsonb, nullable)
      device (varchar(60), nullable)
      os (varchar(60), nullable)
      browser (varchar(60), nullable)
      ip_address (inet, nullable)
      result (varchar(8), NOT NULL, CHECK: success/failure)
      error_code (varchar(40), nullable)
      created_at (timestamptz, default now())

- [ ] Define `settings` table:
      id (uuid PK)
      key (varchar(60), NOT NULL, UNIQUE)
      value (jsonb, NOT NULL)
      + base columns

- [ ] Create prevent_audit_modification() trigger function
- [ ] Create updated_at trigger function
- [ ] Apply triggers to all tables
```

### Task 1.1.3 — Generate & Run Migration
```
- [ ] Run: npx drizzle-kit generate
- [ ] Review generated SQL migration file
- [ ] Run: npx drizzle-kit push
- [ ] Verify tables created in Supabase dashboard
```

### Task 1.1.4 — Create Seed Data
**File: `src/server/db/seed.ts`**
```
- [ ] Seed default roles: Admin, Finance, HR Manager, Sales Lead, Project Owner, Employee, Auditor
- [ ] Seed permissions matrix (all module × action × scope combinations):
      Modules: sales, projects, finance, hr, analytics, audit, settings, crm
      Actions: view, create, edit, delete, export, approve
      Scopes: all, own, assigned
- [ ] Seed role_permissions mappings (per access matrix in SRS Section 3.2)
- [ ] Seed default settings:
      company.name, company.currency, finance.tax_rate, invoice.auto_issue,
      session.timeout_minutes (480), session.max_concurrent (3)
- [ ] Run: npx tsx src/server/db/seed.ts
- [ ] Verify seed data in Supabase dashboard
```

### Task 1.1.5 — Create Indexes
```
- [ ] FK indexes: users(employee_id), sessions(user_id)
- [ ] Audit indexes: audit_logs(actor_id, created_at), audit_logs(entity_type, entity_id), audit_logs(api_route)
- [ ] Session indexes: sessions(user_id, started_at)
```

### Task 1.1.6 — Enable RLS & Create Policies
```
- [ ] Enable RLS on: users, roles, permissions, role_permissions, user_roles, sessions
- [ ] Create helper functions: current_employee_id(), current_has_scope()
- [ ] Create policies:
      - users: own user can SELECT own record; Admin can SELECT/UPDATE all
      - roles: Admin only for modification; authenticated for read
      - sessions: Admin can view all; users see own sessions
      - audit_logs: Admin/Auditor only
      - settings: Admin only for write; authenticated for read
```

---

## 1.2 Backend — Core Infrastructure

### Task 1.2.1 — Database Client
**File: `src/server/db/client.ts`**
```
- [ ] Initialize Drizzle ORM with Supabase PostgreSQL connection
- [ ] Create Supabase server client factory
- [ ] Export db instance and supabase client
```

### Task 1.2.2 — Database Helpers
**File: `src/server/db/helpers.ts`**
```
- [ ] Soft-delete filter helper: .where(isNull(table.deletedAt))
- [ ] Pagination helper: applyPagination(query, page, pageSize) → { data, meta }
- [ ] Sort helper: applySort(query, sort, allowedColumns)
- [ ] Base column defaults for inserts
```

### Task 1.2.3 — Request Context & Types
**File: `src/server/types/context.ts`**
```
- [ ] Define AuthContext interface:
      userId, employeeId, roles, permissions, sessionId,
      device: { device, os, browser }, ip, apiRoute

- [ ] Define DeviceInfo interface:
      device, os, browser, userAgent
```

**File: `src/server/types/errors.ts`**
```
- [ ] AppError base class (statusCode, code, message)
- [ ] UnauthorizedError (401)
- [ ] ForbiddenError (403)
- [ ] NotFoundError (404)
- [ ] ConflictError (409)
- [ ] ValidationError (400)
- [ ] BusinessRuleError (422)
```

**File: `src/server/types/shared.ts`**
```
- [ ] All TypeScript enums (string unions) from TDD Section 17
- [ ] BaseEntity interface
- [ ] ListParams interface (page, pageSize, sort, q, filter)
- [ ] FilterNode type (and/or/field operators)
- [ ] ListResponse<T> interface
- [ ] All Zod schemas for request validation
```

### Task 1.2.4 — Auth Middleware
**File: `src/server/middleware/auth.ts`**
```
- [ ] withAuth(request: NextRequest) → AuthContext
      - Verify JWT via Supabase server client
      - Resolve app user (from users table)
      - Check user is active
      - Load roles and permissions
      - Parse user agent → device info
      - Extract IP from headers
      - Build API route string
      - Return AuthContext
- [ ] Handle: missing token (401), invalid token (401), inactive user (401)
```

### Task 1.2.5 — RBAC Middleware
**File: `src/server/middleware/rbac.ts`**
```
- [ ] requirePermission(module, action, scope?) → (ctx: AuthContext) → RecordScope
      - Check if user has the required permission
      - Return the effective scope for data filtering
      - Throw ForbiddenError if not authorized
- [ ] hasAnyRole(ctx, ...roleNames) → boolean
- [ ] isAdmin(ctx) → boolean
```

### Task 1.2.6 — Validation Middleware
**File: `src/server/middleware/validate.ts`**
```
- [ ] validateBody<T>(schema: ZodSchema<T>, request: NextRequest) → T
- [ ] validateParams(schema: ZodSchema, params: object) → parsed params
- [ ] validateSearchParams(schema: ZodSchema, url: URL) → parsed query
```

### Task 1.2.7 — Error Handler
**File: `src/server/middleware/error-handler.ts`**
```
- [ ] handleError(error: unknown) → NextResponse
      - AppError → structured error response with correct status
      - ZodError → 400 with field-level details
      - Unknown → 500 (log full error, return generic message)
- [ ] Never expose stack traces in production
- [ ] Log errors with Pino (structured, includes request context)
```

### Task 1.2.8 — User Agent Parser
**File: `src/server/lib/user-agent-parser.ts`**
```
- [ ] parseUserAgent(ua: string) → DeviceInfo
      - Extract device type (desktop/mobile/tablet)
      - Extract OS (Windows, macOS, Linux, iOS, Android)
      - Extract browser (Chrome, Firefox, Safari, Edge)
- [ ] Use lightweight regex-based parsing (no heavy dependency)
```

### Task 1.2.9 — Central Audit Wrapper
**File: `src/server/lib/with-audit.ts`**
```
- [ ] withAudit<T>(ctx, action, entityType, entityId, operation) → T
      - Begin database transaction
      - Execute operation (which returns { result, before?, after? })
      - Insert audit_logs entry with full context
      - Commit transaction
      - On failure: log audit entry with result='failure', rethrow
- [ ] This is THE central function — every state change goes through it
```

### Task 1.2.10 — Transaction Wrapper
**File: `src/server/lib/with-transaction.ts`**
```
- [ ] withTransaction<T>(operation: (tx) => Promise<T>) → T
      - For operations that need transactions but not audit (rare)
```

### Task 1.2.11 — Logger
**File: `src/server/lib/logger.ts`**
```
- [ ] Configure Pino logger
      - JSON output in production
      - Pretty print in development
      - Include: timestamp, level, module, requestId
```

### Task 1.2.12 — Filter Parser
**File: `src/server/lib/filter-parser.ts`**
```
- [ ] parseFilter(filterNode: FilterNode, tableSchema) → SQL where clause
      - Handle AND/OR grouping
      - Handle operators: eq, neq, contains, in, gt, lt, between, empty, date_relative
      - Parameterized values (prevent SQL injection)
      - Validate field names against allowed columns
```

---

## 1.3 Backend — Auth & Session API Routes

### Task 1.3.1 — Auth Service
**File: `src/server/services/auth.service.ts`**
```
- [ ] login(email, password, deviceInfo, ip) → { user, session, token }
      - Authenticate via Supabase Auth
      - Create session record (device, OS, browser, IP)
      - Update user.last_login_at
      - Audit: auth.login
      - Return JWT token + user data

- [ ] logout(ctx) → void
      - End session: set ended_at, compute duration_seconds
      - Supabase signOut
      - Audit: auth.logout

- [ ] verify2FA(ctx, code) → { verified }
      - Verify TOTP code
      - Audit: auth.2fa_verify

- [ ] requestPasswordReset(email) → void
      - Generate time-limited reset token
      - Send email via EmailProvider
      - Audit: auth.reset_request

- [ ] resetPassword(token, newPassword) → void
      - Validate token (not expired, not used)
      - Update password via Supabase Auth
      - Invalidate token
      - Audit: auth.reset

- [ ] getMe(ctx) → { user, employee, roles, permissions }
      - Return current user profile with roles and permissions
```

### Task 1.3.2 — Auth Route Handlers
```
- [ ] POST /api/auth/login           → authService.login
- [ ] POST /api/auth/logout          → authService.logout
- [ ] POST /api/auth/2fa/verify      → authService.verify2FA
- [ ] POST /api/auth/password/reset-request → authService.requestPasswordReset
- [ ] POST /api/auth/password/reset  → authService.resetPassword
- [ ] GET  /api/auth/me              → authService.getMe
```

### Task 1.3.3 — Session Route Handlers
```
- [ ] GET    /api/sessions           → List sessions (Admin only, paginated, filterable)
- [ ] DELETE /api/sessions/:id       → Force-terminate session (Admin only, audited)
```

### Task 1.3.4 — RBAC Service
**File: `src/server/services/rbac.service.ts`**
```
- [ ] listRoles() → Role[]
- [ ] createRole(ctx, input) → Role (audited)
- [ ] getRole(id) → Role with permissions
- [ ] updateRole(ctx, id, input) → Role (audited, prevent system role deletion)
- [ ] deleteRole(ctx, id) → void (audited, prevent system role deletion)
- [ ] listPermissions() → Permission[]
```

### Task 1.3.5 — RBAC Route Handlers
```
- [ ] GET    /api/roles              → rbacService.listRoles (Admin)
- [ ] POST   /api/roles              → rbacService.createRole (Admin)
- [ ] GET    /api/roles/:id          → rbacService.getRole (Admin)
- [ ] PATCH  /api/roles/:id          → rbacService.updateRole (Admin)
- [ ] DELETE /api/roles/:id          → rbacService.deleteRole (Admin)
- [ ] GET    /api/permissions        → rbacService.listPermissions (Admin)
```

### Task 1.3.6 — Settings Service & Routes
```
- [ ] GET  /api/settings             → Read settings (Admin)
- [ ] PATCH /api/settings            → Update settings (Admin, audited)
```

---

## 1.4 Frontend — Auth & Dashboard Shell

### Task 1.4.1 — Design System Foundation
**File: `src/app/globals.css`**
```
- [ ] Tailwind CSS configuration with custom theme:
      - Color palette: navy primary, gray-blue secondary, accent blue
      - Dark mode support (class-based)
      - Typography: Inter (body), Outfit (headings) from Google Fonts
      - Spacing scale, border-radius tokens
      - Animation utilities (fade-in, slide-in, scale)
```

### Task 1.4.2 — Base UI Components
**Directory: `src/components/ui/`**
```
- [ ] button.tsx — Primary, Secondary, Ghost, Destructive, Outline variants
- [ ] input.tsx — Text input with label, error state, helper text
- [ ] label.tsx — Form label
- [ ] card.tsx — Card container with header/content/footer
- [ ] badge.tsx — Status badges (success, warning, error, info)
- [ ] avatar.tsx — User avatar with fallback initials
- [ ] skeleton.tsx — Loading skeleton
- [ ] spinner.tsx — Loading spinner
- [ ] separator.tsx — Visual separator
- [ ] toast provider (Sonner) — Toast notifications
```

### Task 1.4.3 — Layout Components
**Directory: `src/components/layout/`**
```
- [ ] sidebar.tsx — Role-aware navigation sidebar
      - Collapsible (full → icon-only)
      - Navigation items filtered by user permissions
      - Active state highlighting
      - User avatar + name at bottom
- [ ] topbar.tsx — Top navigation bar
      - Breadcrumbs
      - Global search (placeholder for now)
      - Notification bell (placeholder)
      - Clock widget area (placeholder)
      - User menu dropdown (profile, settings, logout)
- [ ] breadcrumbs.tsx — Dynamic breadcrumb trail
- [ ] page-header.tsx — Page title + action buttons container
```

### Task 1.4.4 — Auth Pages
```
- [ ] app/(auth)/layout.tsx — Centered auth layout (no sidebar)
- [ ] app/(auth)/login/page.tsx — Login form
      - Email + password inputs
      - "Forgot password?" link
      - Loading state
      - Error display
      - 2FA code input (shown after initial login if 2FA enabled)
      - Redirect to dashboard on success

- [ ] app/(auth)/forgot-password/page.tsx — Password reset request
      - Email input
      - Success message: "Check your email"

- [ ] app/(auth)/reset-password/page.tsx — Password reset completion
      - New password + confirm password
      - Token from URL parameter
      - Redirect to login on success
```

### Task 1.4.5 — Dashboard Shell
```
- [ ] app/(dashboard)/layout.tsx — Main layout with sidebar + topbar
      - Auth guard: redirect to login if not authenticated
      - Load user permissions
      - Provide AuthContext to children

- [ ] app/(dashboard)/page.tsx — Dashboard home
      - "Welcome back, [Name]" header
      - Placeholder KPI cards (will be populated in Phase 7)
      - Quick action buttons based on role
```

### Task 1.4.6 — Settings Pages (Admin)
```
- [ ] app/(dashboard)/settings/page.tsx — Settings overview
- [ ] app/(dashboard)/settings/roles/page.tsx — Roles list with permissions matrix
- [ ] app/(dashboard)/settings/roles/[id]/page.tsx — Edit role permissions
- [ ] app/(dashboard)/settings/general/page.tsx — Company settings (name, currency, etc.)
```

### Task 1.4.7 — Auth Hooks
**File: `src/hooks/use-auth.ts`**
```
- [ ] useAuth() — Returns current user, loading state, login/logout functions
```

**File: `src/hooks/use-permissions.ts`**
```
- [ ] usePermissions() — Returns hasPermission(module, action, scope) function
- [ ] useRequirePermission(module, action) — Redirect if unauthorized
```

### Task 1.4.8 — API Client
**File: `src/lib/api-client.ts`**
```
- [ ] Typed fetch wrapper with:
      - Automatic auth token inclusion
      - JSON serialization/deserialization
      - Error handling (parse error response)
      - TypeScript generics for type-safe responses
```

---

## 1.5 Verification Checklist — Phase 1

```
- [ ] Users can log in with email/password
- [ ] JWT token issued and stored securely
- [ ] Session created with device/browser/IP
- [ ] Session ended on logout with duration computed
- [ ] /api/auth/me returns current user with roles and permissions
- [ ] Admin can view and terminate sessions
- [ ] Roles CRUD working (Admin only)
- [ ] Permissions catalogue populated
- [ ] Role-permission assignments working
- [ ] Settings CRUD working
- [ ] Audit log records every state-changing action
- [ ] Audit log includes: actor, session, action, route, device, IP, before/after
- [ ] RLS policies block unauthorized access at DB level
- [ ] Non-admin users get 403 on admin routes
- [ ] Invalid/expired tokens get 401
- [ ] Validation errors return 400 with details
- [ ] Sidebar shows/hides items based on permissions
- [ ] Login → Dashboard redirect working
- [ ] Logout → Login redirect working
- [ ] All CI checks passing (lint, types, tests, build)
- [ ] Successfully deployed to Netlify
```

---

*Phase 1 completion = Milestone M1 (Core Platform). Proceed to Phase 2 (HR & People).*
