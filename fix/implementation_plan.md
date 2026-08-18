# Senyx — Implementation Plan
*Generated after full codebase inspection · Next.js 14 App Router · Drizzle ORM · Supabase Auth*

---

## 1. Current System Analysis

### Architecture
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Auth:** Supabase Auth (cookie-based SSR sessions via `@supabase/ssr`)
- **Database:** PostgreSQL via Drizzle ORM
- **Styling:** Tailwind CSS + shadcn/ui components
- **ORM Layer:** Drizzle with typed schemas in `src/server/db/schema/`

### Relevant Frontend Components

| Component | Path | Purpose |
|---|---|---|
| `LeavePage` | `src/app/(dashboard)/hr/leave/page.tsx` | Lists leave requests, shows approve/reject for all users |
| `LeaveRequestModal` | `src/components/hr/leave-request-modal.tsx` | Form to submit a leave request |
| `AccountsPage` | `src/app/(dashboard)/crm/accounts/page.tsx` | CRM accounts list + Add Account sheet |
| `AccountForm` | `src/components/crm/account-form.tsx` | Create/edit account form |
| `ProjectsPage` | `src/app/(dashboard)/projects/page.tsx` | Projects list + Add Project sheet |
| `ProjectForm` | `src/components/projects/project-form.tsx` | Create project form |
| `Sidebar` | `src/components/layout/sidebar.tsx` | Navigation — navGroups array drives all links |
| `useAuth` | `src/hooks/use-auth.ts` | Exposes user, roles, permissions, isLoading |
| `usePermissions` | `src/hooks/use-permissions.ts` | hasPermission(module, action) helper |

### Backend / API Structure

| Route | Method | Service |
|---|---|---|
| `/api/leave-requests` | GET, POST | `leave.service.ts` |
| `/api/leave-requests/[id]/decision` | POST | `leave.service.ts` |
| `/api/leave-types` | GET | Inline DB query |
| `/api/employees` | GET, POST | `employee.service.ts` |
| `/api/accounts` | GET, POST | `crm.service.ts` |
| `/api/accounts/[id]` | GET, PATCH, DELETE | `crm.service.ts` |
| `/api/projects` | GET, POST | `project.service.ts` |
| `/api/projects/[id]` | GET, PATCH, DELETE | `project.service.ts` |
| `/api/projects/[id]/assignments` | GET, POST | `assignment.service.ts` |
| `/api/auth/me` | GET | `auth.service.ts` |

> **Note:** The project form fetches `/api/crm/accounts` — this route **does not exist**. The correct route is `/api/accounts`.

### Database Models (Relevant Schemas)

**`identity.ts`**
- `users` — id (Supabase UUID), employeeId (FK → employees), email, isActive
- `roles`, `permissions`, `rolePermissions`, `userRoles` — full RBAC system

**`hr.ts`**
- `employees` — id, employeeCode, firstName, lastName, email, departmentId, designationId
- `leaveTypes` — id, name, defaultAnnualDays
- `leaveBalances` — employeeId, leaveTypeId, year, balanceDays
- `leaveRequests` — id, employeeId, leaveTypeId, startDate, endDate, days, reason, status, approverId, decidedAt
  - status check constraint: IN ('pending', 'approved', 'rejected', 'cancelled')
  - No column changes needed for leave

**`crm.ts`**
- `accounts` — id, name, industry, size, website, address (jsonb), status, ownerId (FK → employees)
- `contacts` — id, accountId, firstName, lastName, email, phone, title, isPrimary
  - Client model **already exists** as `contacts` linked to `accounts`

**`projects.ts`**
- `projects` — id, code, name, type, accountId, dealId, ownerId, billingType, status, startDate, endDate, budget, currency
- `projectAssignments` — id, projectId, employeeId, roleOnProject, allocationPct
  - Many-to-many employee to project **already exists** via `projectAssignments`

### Authentication and Authorization
- **Session:** Supabase cookie-based sessions checked in every API route via `withAuth(req)` → returns `AuthContext { userId, employeeId, roles, permissions }`
- **RBAC:** `roles` (e.g. "Admin", "HR Manager") + fine-grained `permissions { module, action, scope }`
- **Backend:** `withAuth` → `UnauthorizedError` (401) if not logged in. Role checks done inline per route.
- **Frontend:** `useAuth()` exposes roles. `usePermissions()` exposes `hasPermission()`. `useRequirePermission()` redirects to /unauthorized if missing permission.
- **Frontend Route Guard:** Currently `DashboardLayout` only checks user existence. No admin-only page guard exists yet for `hr/approval`.

---

## 2. Problems Found

### Problem 1 — Leave Request Submit: Error Message Extraction Mismatch

**File:** `src/components/hr/leave-request-modal.tsx` (line 88)

**Root Cause:**

The actual API error shape (from error-handler.ts) is:
```json
{ "error": { "code": "...", "message": "...", "details": [...] } }
```

But the modal reads:
```ts
const error = await res.json()
throw new Error(error.error || "Failed to request leave")
// error.error is an OBJECT, not a string → throws "[object Object]"
```

The modal reads `error.error` (an object with code and message) instead of `error.error.message`.

**Impact:** When the backend returns any error (e.g. "No leave balance found for this type in the current year"), the toast shows `[object Object]` and the form appears completely broken.

---

### Problem 2 — Leave Request Submit: leaveTypeId Not Pre-Selected / UUID Validation Race

**File:** `src/components/hr/leave-request-modal.tsx` (line 37)

**Root Cause:**
The Zod schema requires `leaveTypeId: z.string().uuid()`, but there is no default value set in `useForm`. If the user submits without selecting a type (or if the dropdown is empty because `/api/leave-types` hasn't loaded yet), Zod throws a validation error in the frontend. This is then caught and shown as `[object Object]` due to Problem 1's error-reading bug.

Additionally, if `/api/leave-types` returns an empty array (no leave types seeded), the select is empty and the form can never submit.

---

### Problem 3 — Leave Request Submit: No Employee Balance Produces Unclear 500 Error

**File:** `src/server/services/leave.service.ts` (line 49)

**Root Cause:**
```ts
if (!balance) {
  throw new Error('No leave balance found for this type in the current year');
}
```
The backend throws a generic `Error` (not an `AppError`). `handleError` catches this as an unhandled error and returns a 500 with "An unexpected error occurred" instead of a 422 with the real message.

---

### Problem 4 — Leave Page: Approve/Reject Shown to All Employees

**File:** `src/app/(dashboard)/hr/leave/page.tsx` (lines 73–85)

**Root Cause:**
The Approve/Reject action buttons are rendered for any user when `req.status === 'pending'`. There is no role check in the UI. Employees can see and click these buttons on their own requests. When they click, the decision endpoint correctly returns 401 Unauthorized, but the frontend just shows the error rather than hiding the buttons.

---

### Problem 5 — Leave Page: listLeaveRequests Returns No Employee Name

**File:** `src/server/services/leave.service.ts` (line 24–29)

**Root Cause:**
```ts
return await db.select().from(leaveRequests).where(...);
```
No JOIN to employees or leaveTypes. The frontend tries to display `row.original.employeeName` and `row.original.leaveTypeName`, but these columns don't exist on the raw leaveRequests table → shows "Unknown" for both columns.

---

### Problem 6 — Project Form: Wrong API Endpoint for Accounts

**File:** `src/components/projects/project-form.tsx` (line 33)

**Root Cause:**
```ts
fetch('/api/crm/accounts')  // This route does NOT exist
```
The actual accounts API route is `/api/accounts`. This means the account dropdown in the project form is always empty, making it impossible to link a project to an account via "Solution" type.

---

### Problem 7 — Account Form: ownerId Field Missing

**File:** `src/components/crm/account-form.tsx`

**Root Cause:**
The `accounts` table has an `ownerId` FK column (references `employees.id`), and the API schema accepts `ownerId`. However, the `AccountForm` component has no "Accountable Employee" field at all. The field is silently dropped.

---

### Problem 8 — Project Form: Missing Required Fields

**File:** `src/components/projects/project-form.tsx`

**Root Cause:**
The project form only has: Name, Budget, Type, Account (conditional). Missing fields that the DB/API fully support:
- `ownerId` (Accountable Person) — currently defaults to ctx.employeeId in the service
- `startDate` / `endDate` — schema has them, form doesn't
- Developers/team (via projectAssignments) — not part of creation flow

---

### Problem 9 — No Admin Approval Page

**File:** No file exists for `src/app/(dashboard)/hr/approval/`

The entire Approval section for admins is missing. The current Leave page conflates the employee view (submit requests) with admin actions (approve/reject), and does so with no authorization guard.

---

### Problem 10 — Project API: 'internal' Type Not in PATCH Schema

**File:** `src/app/api/projects/[id]/route.ts` (line 9)

```ts
type: z.enum(['solution', 'product']).optional(),  // missing 'internal'
```
The POST schema allows 'internal' but the PATCH schema doesn't. Updating a project to/from internal type will fail validation.

---

## 3. Database Changes

### No New Tables or Migrations Required

All required structures already exist:

| Requirement | Existing Structure | Status |
|---|---|---|
| Leave request fields | leaveRequests table | Complete |
| Leave status (pending/approved/rejected) | status check constraint | Complete |
| Approver tracking | approverId, decidedAt columns | Complete |
| Comment on decision | Not in schema | Optional — see below |
| Employee dropdown for accounts | employees table, accounts.ownerId column | Complete |
| Client Details | contacts table linked to accounts | Complete |
| Project accountable person | projects.ownerId column | Complete |
| Project developers | projectAssignments table | Complete |
| Project start/end date | projects.startDate, projects.endDate columns | Complete |
| Project budget | projects.budget column | Complete |
| Project account link | projects.accountId column | Complete |

### One Optional Schema Change

Add `comment` field to `leaveRequests` (for rejection/approval notes):

```ts
// In src/server/db/schema/hr.ts — leaveRequests table:
comment: text('comment'),  // Admin's approval/rejection note
```

Migration: Add one nullable text column — zero breaking changes.

This is **optional** — skip it if approval comments are not needed now.

---

## 4. Backend / API Changes

### 4.1 Fix: listLeaveRequests — Add Joins for Names

**File:** `src/server/services/leave.service.ts`

Rewrite `listLeaveRequests` to JOIN employees and leaveTypes:

```ts
import { departments, leaveTypes } from '../db/schema/hr';

export async function listLeaveRequests(scope: 'all' | 'own', currentEmployeeId: string) {
  const query = db
    .select({
      id: leaveRequests.id,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      days: leaveRequests.days,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      approverId: leaveRequests.approverId,
      decidedAt: leaveRequests.decidedAt,
      createdAt: leaveRequests.createdAt,
      employeeId: leaveRequests.employeeId,
      employeeName: sql`${employees.firstName} || ' ' || ${employees.lastName}`,
      employeeCode: employees.employeeCode,
      departmentName: departments.name,
      leaveTypeName: leaveTypes.name,
      leaveTypeId: leaveRequests.leaveTypeId,
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id));

  if (scope === 'own') {
    return query.where(eq(leaveRequests.employeeId, currentEmployeeId));
  }
  return query;
}
```

---

### 4.2 Fix: createLeaveRequest — Throw AppError for Business Failures

**File:** `src/server/services/leave.service.ts`

```ts
// Add import:
import { AppError } from '../types/errors';

// Replace plain Error throws:
if (!balance) {
  throw new AppError(
    'No leave balance found for this leave type in the current year. Please contact HR.',
    422,
    'NO_BALANCE'
  );
}
if (requestedDays > availableDays) {
  throw new AppError(
    `Insufficient leave balance. You have ${availableDays} day(s) available.`,
    422,
    'INSUFFICIENT_BALANCE'
  );
}
```

---

### 4.3 Fix: Decision Route — Use ForbiddenError + hasAnyRole

**File:** `src/app/api/leave-requests/[id]/decision/route.ts`

```ts
import { ForbiddenError } from '../../../../../server/types/errors';
import { hasAnyRole } from '../../../../../server/middleware/rbac';

// Replace:
const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
if (!isAdminOrHR) {
  throw new UnauthorizedError('Only managers can decide leave requests');
}

// With:
if (!hasAnyRole(ctx, 'Admin', 'HR Manager')) {
  throw new ForbiddenError('Only Admin or HR Manager can approve or reject leave requests');
}

// Also add optional comment field:
const DecideLeaveRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(500).optional(),
});
```

---

### 4.4 Fix: Projects API — Add 'internal' to PATCH Schema

**File:** `src/app/api/projects/[id]/route.ts` (line 9)

```ts
// Before:
type: z.enum(['solution', 'product']).optional(),

// After:
type: z.enum(['solution', 'product', 'internal']).optional(),
```

---

### 4.5 Fix: Projects API — Add Date Validation

**File:** `src/app/api/projects/route.ts`

```ts
const schema = z.object({
  // ... existing fields ...
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().nullable(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, { message: 'End date cannot be before start date', path: ['endDate'] });
```

---

### 4.6 New: Employee Minimal List Endpoint for Dropdowns

**File:** `src/app/api/employees/route.ts`

Add `?minimal=true` query param. Returns `{ id, firstName, lastName, email, employeeCode }` for all active employees regardless of caller role. This allows all authenticated users (not just admins) to populate dropdowns without exposing sensitive fields.

```ts
// In GET handler, before existing scope logic:
const isMinimal = req.nextUrl.searchParams.get('minimal') === 'true';
if (isMinimal) {
  const data = await db.select({
    id: employees.id,
    firstName: employees.firstName,
    lastName: employees.lastName,
    email: employees.email,
    employeeCode: employees.employeeCode,
  }).from(employees).where(eq(employees.status, 'active'));
  return NextResponse.json({ data });
}
```

---

### 4.7 Fix: Enrich listAccounts with Owner Name

**File:** `src/server/services/crm.service.ts`

```ts
export async function listAccounts() {
  return await db.select({
    id: accounts.id,
    name: accounts.name,
    industry: accounts.industry,
    size: accounts.size,
    website: accounts.website,
    address: accounts.address,
    status: accounts.status,
    ownerId: accounts.ownerId,
    createdAt: accounts.createdAt,
    updatedAt: accounts.updatedAt,
    deletedAt: accounts.deletedAt,
    ownerName: sql`${employees.firstName} || ' ' || ${employees.lastName}`,
  })
  .from(accounts)
  .leftJoin(employees, eq(accounts.ownerId, employees.id))
  .where(isNull(accounts.deletedAt))
  .orderBy(desc(accounts.createdAt));
}
```

---

## 5. Frontend Changes

### 5.1 Fix: leave-request-modal.tsx — Error Extraction

**File:** `src/components/hr/leave-request-modal.tsx`

**Change 1 — Fix error message extraction (line 88):**
```ts
// Before:
throw new Error(error.error || "Failed to request leave")

// After:
throw new Error(error.error?.message || error.message || "Failed to request leave")
```

**Change 2 — Add endDate >= startDate validation:**
```ts
const formSchema = z.object({
  leaveTypeId: z.string().uuid("Please select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, { message: "End date cannot be before start date", path: ["endDate"] });
```

**Change 3 — Handle empty leave types gracefully:**
```tsx
{leaveTypes.length === 0 ? (
  <SelectItem value="__none__" disabled>No leave types available — contact HR</SelectItem>
) : (
  leaveTypes.map((type) => (
    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
  ))
)}
```

---

### 5.2 Fix: leave/page.tsx — Fix Loading Race + Hide Admin Buttons

**File:** `src/app/(dashboard)/hr/leave/page.tsx`

**Change 1 — Fix loading race condition:**
```ts
// Before (broken — Promise.resolve is a no-op before fetch):
Promise.resolve().then(() => setLoading(true))
fetch("/api/leave-requests")...

// After:
const fetchLeave = async () => {
  setLoading(true)
  try {
    const res = await fetch("/api/leave-requests")
    const json = await res.json()
    setData(json.data || [])
  } finally {
    setLoading(false)
  }
}
```

**Change 2 — Hide Approve/Reject from non-admins:**
```tsx
import { useAuth } from "@/hooks/use-auth"

// Inside component:
const { roles } = useAuth()
const isAdminOrHR = roles.includes('Admin') || roles.includes('HR Manager')

// In action column cell:
if (req.status !== 'pending' || !isAdminOrHR) return null
```

---

### 5.3 New: Admin Approval Page

**File:** `src/app/(dashboard)/hr/approval/page.tsx` (CREATE NEW)

Full page with:
- Route guard: redirect non-admins to `/`
- Fetch `/api/leave-requests` (admin scope returns all)
- Filter tabs: All | Pending | Approved | Rejected
- Data table columns: Employee, Employee ID, Department, Leave Type, Start Date, End Date, Days, Reason, Submitted On, Status, Actions
- Approve/Reject buttons only on pending rows
- Optional comment input in a confirm dialog
- Auto-refresh after decision via `fetchLeave()` callback

Frontend route guard pattern:
```tsx
const { roles, isLoading } = useAuth()
const router = useRouter()

useEffect(() => {
  if (!isLoading && !roles.includes('Admin') && !roles.includes('HR Manager')) {
    router.replace('/')
  }
}, [isLoading, roles, router])
```

---

### 5.4 New: Sidebar — Add Conditional Approval Link

**File:** `src/components/layout/sidebar.tsx`

Move `navGroups` inside the `Sidebar` component so it has access to `roles` from `useAuth()`. Add the Approval link conditionally:

```tsx
export function Sidebar() {
  const { roles } = useAuth()
  const isAdminOrHR = roles.includes('Admin') || roles.includes('HR Manager')
  
  const navGroups = [
    {
      label: 'HR & People',
      color: '#7F4D9F',
      bg: '#F2E8FA',
      items: [
        { href: '/hr/employees', label: 'Employees', icon: Users },
        { href: '/hr/leave', label: 'Leave', icon: ClipboardList },
        ...(isAdminOrHR ? [{ href: '/hr/approval', label: 'Approval', icon: CheckSquare }] : []),
      ]
    },
    // ... other groups unchanged
  ]
}
```

Import `CheckSquare` from lucide-react.

---

### 5.5 Fix: account-form.tsx — Add Accountable Employee and Client Details

**File:** `src/components/crm/account-form.tsx`

**A. Add Employee Dropdown (ownerId):**
- Fetch `/api/employees?minimal=true` on mount
- Add a Select field for `ownerId` showing `First Last (email)` for each employee
- Add to Zod schema: `ownerId: z.string().uuid().optional().or(z.literal(''))`
- Pass in POST/PATCH body

**B. Add Client Details Section (Primary Contact):**
Use the existing `contacts` table (linked to accounts). After creating an account, create a contact record if fields are filled.

Section UI: Primary Contact (Optional)
- First Name (required if section is open)
- Last Name
- Email
- Phone
- Job Title
- Is Primary checkbox

Implementation:
1. POST `/api/accounts` to create the account → get `newAccount.id`
2. If contact fields have values, POST `/api/contacts` with `{ accountId: newAccount.id, firstName, lastName, email, phone, title, isPrimary: true }`

Updated Zod schema:
```ts
const schema = z.object({
  name: z.string().min(1, 'Account name is required'),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  status: z.enum(['prospect', 'active', 'inactive']),
  ownerId: z.string().uuid().optional().or(z.literal('')),
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactTitle: z.string().optional(),
})
```

---

### 5.6 Fix: accounts/page.tsx — Add Owner Column

**File:** `src/app/(dashboard)/crm/accounts/page.tsx`

Add `Owner` column using `ownerName` from the enriched API response:
```tsx
{
  accessorKey: 'ownerName',
  header: 'Account Owner',
  cell: ({ row }: any) => row.getValue('ownerName') || '—',
}
```

---

### 5.7 Fix and Extend: project-form.tsx — Complete the Form

**File:** `src/components/projects/project-form.tsx`

**A. Fix wrong API URL:**
```ts
fetch('/api/accounts')  // was: /api/crm/accounts
```

**B. Add Owner (Accountable Person) dropdown:**
- Fetch `/api/employees?minimal=true`
- Add `ownerId` select field showing employee name

**C. Add Developers multi-select:**
- Multi-checkbox list of all active employees
- After project creation, call `POST /api/projects/${id}/assignments` for each selected developer

**D. Add Start Date and End Date:**
```tsx
<Input type="date" value={formData.startDate} onChange={...} />
<Input type="date" value={formData.endDate} onChange={...} min={formData.startDate} />
```

**E. Frontend date validation:**
```ts
if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
  toast.error('End date cannot be before start date')
  return
}
```

**F. Updated form state:**
```ts
const [formData, setFormData] = React.useState({
  name: '',
  accountId: '',
  ownerId: '',
  type: 'internal',
  billingType: 'fixed',
  budget: '',
  currency: 'USD',
  startDate: '',
  endDate: '',
})
const [selectedDevelopers, setSelectedDevelopers] = React.useState<string[]>([])
```

---

## 6. Authorization and Security

### Leave

| Action | Who | Backend | Frontend |
|---|---|---|---|
| Submit leave request | Any authenticated employee | withAuth + ctx.employeeId check | LeaveRequestModal available to all |
| View own leave requests | Own employee | Scoped query (scope: 'own') | Shown on Leave page |
| View all leave requests | Admin / HR Manager | Scoped query (scope: 'all') | Only accessible via Approval page |
| Approve / Reject | Admin / HR Manager | hasAnyRole throws ForbiddenError | Buttons hidden using roles check |

### Accounts

| Action | Who | Backend |
|---|---|---|
| View accounts | All authenticated users | withAuth only |
| Create/edit account | All authenticated users | withAuth only (no role restriction currently) |

### Projects

| Action | Who | Backend |
|---|---|---|
| View projects | All authenticated users | withAuth only |
| Create project | Employees only (ctx.employeeId required) | Throws if no employee profile |
| Edit/delete project | All authenticated users | withAuth only — no ownership check (pre-existing risk) |

### How to Prevent Frontend Bypass
- Frontend guards (role checks in sidebar/components) are UX convenience only
- Backend always enforces: every API route calls `withAuth()` → throws 401 if not authenticated
- The decision endpoint enforces role check → throws 403 if not admin/HR
- No sensitive operation is frontend-only protected

---

## 7. Implementation Order

```
1.  [CRITICAL] Fix leave.service.ts — AppError for business failures
2.  [CRITICAL] Fix leave-request-modal.tsx — error extraction bug
3.  [CRITICAL] Fix listLeaveRequests — JOIN employees and leaveTypes
4.  [HIGH]     Add endDate >= startDate validation (modal + API)
5.  [HIGH]     Fix leave/page.tsx — loading race + hide buttons from non-admins
6.  [HIGH]     Create hr/approval/page.tsx — Admin Approval page
7.  [HIGH]     Update sidebar.tsx — add conditional Approval nav item
8.  [HIGH]     Fix project-form.tsx — wrong API URL for accounts
9.  [HIGH]     Add employees minimal API (?minimal=true)
10. [HIGH]     Add ownerId employee dropdown to account-form.tsx
11. [HIGH]     Add primary contact section to account-form.tsx
12. [MEDIUM]   Add ownerId, startDate, endDate, developers to project-form.tsx
13. [MEDIUM]   Fix projects/[id]/route.ts — add 'internal' to PATCH schema
14. [MEDIUM]   Enrich listAccounts() with ownerName JOIN
15. [LOW]      Add optional comment field to leaveRequests schema (migration)
16. [LOW]      Add comment input to Approval page decision flow
```

---

## 8. Exact File-by-File Changes

---

### File: `src/server/services/leave.service.ts`

**Changes:**
1. Import `AppError` from `'../types/errors'`
2. Import `departments`, `leaveTypes` from schema (leaveTypes is already imported via schema, add departments)
3. Rewrite `listLeaveRequests` to LEFT JOIN employees, leaveTypes, departments
4. Replace plain `throw new Error(...)` in `createLeaveRequest` with `throw new AppError(..., 422, 'CODE')`
5. (Optional) Add `comment` param to `decideLeaveRequest` and persist it

---

### File: `src/components/hr/leave-request-modal.tsx`

**Changes:**
1. Line 88: `error.error?.message || error.message || "Failed to request leave"`
2. Add `.refine()` to formSchema for end >= start date
3. Handle empty leaveTypes array in dropdown
4. Show computed days count between start and end date as a preview

---

### File: `src/app/(dashboard)/hr/leave/page.tsx`

**Changes:**
1. Import `useAuth` from `@/hooks/use-auth`
2. Fix `fetchLeave` to use proper async/await with setLoading at top
3. Use `roles` to conditionally hide Approve/Reject action buttons
4. Update `LeaveRequest` type to include `departmentName` for display

---

### File: `src/app/(dashboard)/hr/approval/page.tsx` — CREATE NEW

New admin-only approval page:
- Role guard redirecting non-admins to `/`
- Fetch `/api/leave-requests`
- Filter tabs: All | Pending | Approved | Rejected
- Rich data table with all employee and leave info
- Approve/Reject with optional comment dialog using shadcn AlertDialog or Dialog
- Auto-refresh after decision

---

### File: `src/components/layout/sidebar.tsx`

**Changes:**
1. Move navGroups constant definition inside the Sidebar function body
2. Add conditional Approval item to HR & People group using `isAdminOrHR`
3. Import `CheckSquare` from lucide-react

---

### File: `src/components/crm/account-form.tsx`

**Changes:**
1. Add `useEffect` to fetch `/api/employees?minimal=true` → store in `employees` state
2. Add `ownerId` Select field with employee dropdown
3. Add collapsible "Primary Contact (Optional)" section with firstName, lastName, email, phone, title
4. Update Zod schema to include ownerId and contact fields
5. Update submit handler: create account first, then create contact if fields are populated

---

### File: `src/app/(dashboard)/crm/accounts/page.tsx`

**Changes:**
1. Add `ownerName` column to the table
2. Pass `ownerId` in initialData when opening edit sheet

---

### File: `src/server/services/crm.service.ts`

**Changes:**
1. `listAccounts()` — add LEFT JOIN to employees to get ownerName
2. `getAccount()` — add employee JOIN for owner name in detail view

---

### File: `src/components/projects/project-form.tsx`

**Changes:**
1. Fix `/api/crm/accounts` to `/api/accounts`
2. Add fetch for `/api/employees?minimal=true`
3. Add `ownerId` select (Accountable Person)
4. Add `startDate` and `endDate` date inputs
5. Add multi-select/checkbox list for developers
6. Update submit to include all new fields and post assignments for each developer
7. Add client-side endDate >= startDate validation

---

### File: `src/app/api/projects/route.ts`

**Changes:**
1. Add date regex validation to startDate and endDate fields
2. Add `.refine()` for end >= start date cross-field validation

---

### File: `src/app/api/projects/[id]/route.ts`

**Changes:**
1. Line 9: Add 'internal' to the type enum in the PATCH schema

---

### File: `src/app/api/employees/route.ts`

**Changes:**
1. Add early return for `?minimal=true` query param
2. Return only `{ id, firstName, lastName, email, employeeCode }` for active employees with no role restriction

---

### File: `src/app/api/leave-requests/[id]/decision/route.ts`

**Changes:**
1. Import `ForbiddenError` instead of using `UnauthorizedError` for role failure
2. Import and use `hasAnyRole` from `rbac.ts`
3. (Optional) Add `comment` field to DecideLeaveRequestSchema and pass to service

---

### File: `src/server/db/schema/hr.ts` — OPTIONAL

**Changes (only if adding approval comments):**
1. Add `comment: text('comment')` to leaveRequests table definition

---

### Migration — OPTIONAL

```sql
-- If adding comment column:
ALTER TABLE leave_requests ADD COLUMN comment text;
```

---

## 9. Testing Plan

### Leave

| Test Case | Expected Result |
|---|---|
| Submit valid leave request with balance | 201, toast success, list refreshes automatically |
| Submit with end date before start date | Frontend validation error before API call |
| Submit without selecting leave type | Zod validation error shown inline on field |
| Submit with insufficient balance | 422 from API with clear message shown in toast |
| Submit when not logged in | 401 → redirect to login |
| Admin approves pending request | Status becomes approved, balance deducted, notification sent |
| Admin rejects pending request | Status becomes rejected, balance unchanged |
| Employee calls decision API directly | 403 ForbiddenError |
| Non-admin views leave page | Approve/Reject buttons not rendered |
| Admin views approval page | All requests shown with full employee info |
| Admin filters by Pending tab | Only pending requests shown |

### Accounts

| Test Case | Expected Result |
|---|---|
| Create account without owner | Account created with ownerId null |
| Create account with employee as owner | ownerId stored, owner name shown in list |
| Create account with primary contact | Account + contact both created, contact linked via accountId |
| Invalid contact email | Frontend form validation error on email field |
| Invalid website URL | Frontend form validation error on website field |
| Edit account to change owner | PATCH updates ownerId correctly |

### Projects

| Test Case | Expected Result |
|---|---|
| Create project — internal type | Created without requiring accountId |
| Create project — solution type without account | Validation error: account required |
| Create project — solution type with account | Created, accountId stored correctly |
| Create project with start/end dates | Both stored, visible in project detail |
| End date before start date | Frontend validation error before submission |
| Create project with developers | Project created, one assignment per developer |
| Set accountable person (ownerId) | ownerId stored, owner assigned to project |
| Invalid budget (negative) | Validation error |
| PATCH project type to 'internal' | Now allowed — PATCH schema includes 'internal' |

### Permissions

| Test Case | Expected Result |
|---|---|
| Employee navigates to /hr/approval | Redirected to / immediately |
| Employee calls POST /api/leave-requests/[id]/decision | 403 ForbiddenError returned |
| Admin views /hr/approval | Full approval table rendered |
| Admin approves via API | 200, request status updated to approved |
| Logged-out user calls any API | 401 UnauthorizedError returned |

---

## 10. Final Summary

### Files to Modify

- `src/server/services/leave.service.ts`
- `src/components/hr/leave-request-modal.tsx`
- `src/app/(dashboard)/hr/leave/page.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/crm/account-form.tsx`
- `src/server/services/crm.service.ts`
- `src/app/(dashboard)/crm/accounts/page.tsx`
- `src/components/projects/project-form.tsx`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/employees/route.ts`
- `src/app/api/leave-requests/[id]/decision/route.ts`

### Files to Create

- `src/app/(dashboard)/hr/approval/page.tsx`
- (Optional) Migration SQL for comment column on leave_requests

### Database Changes

- **No new tables** required — all structures already exist
- Optional: Add `comment text` column to `leave_requests` table
- Service-level JOINs enrich existing queries without schema changes

### API Changes

| Endpoint | Change |
|---|---|
| `GET /api/leave-requests` | Returns enriched data with employeeName, leaveTypeName, departmentName |
| `POST /api/leave-requests` | Better error messages via AppError (422 instead of 500) |
| `POST /api/leave-requests/[id]/decision` | Use ForbiddenError + hasAnyRole helper; optional comment param |
| `GET /api/employees?minimal=true` | New query param — returns non-sensitive employee list for dropdowns |
| `GET /api/accounts` | Returns ownerName via LEFT JOIN to employees |
| `PATCH /api/projects/[id]` | Allow 'internal' in type enum |
| `POST /api/projects` | Add date regex + end >= start refine validation |

### Frontend Changes

| Component | Change |
|---|---|
| `leave-request-modal.tsx` | Fix error extraction; add date range validation |
| `leave/page.tsx` | Fix loading race; hide admin buttons from non-admins |
| `hr/approval/page.tsx` | Create new admin-only approval page |
| `sidebar.tsx` | Add conditional Approval nav item for Admin/HR role |
| `account-form.tsx` | Add owner dropdown + client contact section |
| `accounts/page.tsx` | Add ownerName column to table |
| `project-form.tsx` | Fix API URL; add owner, dates, developers fields |

### Potential Risks

1. **listLeaveRequests JOIN** — existing code that destructures the result assumes raw leaveRequests columns. Verify no other callers break after the signature changes.
2. **listAccounts JOIN** — ensure the named select pattern correctly aliases columns without collision.
3. **account-form.tsx two-step submit** — if account creation succeeds but contact creation fails, the account exists without a contact. Show a partial success message and allow retry.
4. **Project developers assignment loop** — if one assignment fails (e.g. duplicate unique constraint), others may still succeed. Handle partial failures gracefully or wrap in a batch endpoint.
5. **Sidebar navGroups moved inside component** — causes navGroups to rebuild on every render. Memoize with `useMemo` to prevent unnecessary re-renders.
6. **No project ownership check on DELETE/PATCH** — any authenticated user can edit or delete any project. Pre-existing risk — add ownership/admin check in a future iteration.
7. **Leave balance deduction race condition** — concurrent approvals of the same employee's requests could trigger the DB check constraint `balance_days >= 0`. Catch and convert the DB constraint error to a user-friendly message.

---

### Recommended Implementation Priority

| # | Requirement | Priority |
|---|---|---|
| 1 | Fix Leave Submit — error extraction bug | 🔴 Critical |
| 2 | Fix Leave Submit — AppError for balance/business errors | 🔴 Critical |
| 3 | Fix Leave list — JOIN for employee/type names | 🔴 Critical |
| 4 | Admin Approval Page (new page + sidebar link) | 🟠 High |
| 5 | Hide approve/reject from non-admins in Leave page | 🟠 High |
| 6 | Fix Project form — wrong API URL (/api/crm/accounts) | 🟠 High |
| 7 | Add Accountable Employee to Account form | 🟠 High |
| 8 | Add Client Details (contact) to Account form | 🟠 High |
| 9 | Add Accountable Person + Developers to Project form | 🟡 Medium |
| 10 | Add Start/End dates to Project form | 🟡 Medium |
| 11 | Fix PATCH projects schema (add 'internal') | 🟡 Medium |
| 12 | Add date validation (end >= start) to Project API | 🟡 Medium |
| 13 | Enrich account list with owner name | 🟢 Low |
| 14 | Add optional approval comment field | 🟢 Low |
| 15 | Leave balance display in modal | 🟢 Low |
