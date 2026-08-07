# Phase 2 — HR & People (Single Source of Truth)

**Duration:** 1–2 weeks  
**Dependencies:** Phase 1 (Auth + RBAC + Audit)  
**Tables:** 10 — `departments`, `designations`, `employees`, `skills`, `employee_skills`, `leave_types`, `leave_balances`, `leave_requests`, `payroll_records`, `performance_reviews`  
**API Routes:** 22  
**Security:** Encryption at rest for sensitive fields (Phase S — S.3.1)  

---

## 2.1 Database Schema — HR & People

### Task 2.1.1 — Create Drizzle Schema: HR

**File: `src/server/db/schema/hr.ts`**

```
- [x] Define `departments` table:
      name (varchar(80), NOT NULL, UNIQUE)
      description (text, nullable)
      + base columns

- [x] Define `designations` table:
      title (varchar(80), NOT NULL, UNIQUE) — job title, grants NO permissions
      description (text, nullable)
      + base columns

- [x] Define `employees` table (SINGLE SOURCE OF TRUTH FOR PEOPLE):
      employee_code (varchar(20), NOT NULL, UNIQUE) — e.g. SNX-0001
      first_name (varchar(60), NOT NULL)
      last_name (varchar(60), NOT NULL)
      email (citext, NOT NULL, UNIQUE)
      phone (varchar(30), nullable)
      designation_id (uuid, NOT NULL, FK → designations)
      department_id (uuid, nullable, FK → departments)
      manager_id (uuid, nullable, FK → employees — self-reference)
      employment_type (varchar(15), NOT NULL, CHECK: full_time/part_time/contract/intern)
      start_date (date, NOT NULL)
      end_date (date, nullable) — CHECK: end_date >= start_date
      status (varchar(15), NOT NULL, CHECK: active/on_leave/suspended/terminated, default 'active')
      salary (numeric(14,2), nullable) — ENCRYPTED AT REST
      bank_details (jsonb, nullable) — ENCRYPTED AT REST
      national_id (varchar(40), nullable) — ENCRYPTED AT REST
      emergency_contact (jsonb, nullable) — {name, phone, relation}
      + base columns

- [x] Define `skills` table:
      name (varchar(60), NOT NULL, UNIQUE)
      category (varchar(40), nullable)
      + base columns

- [x] Define `employee_skills` join table:
      employee_id (uuid, NOT NULL, FK → employees)
      skill_id (uuid, NOT NULL, FK → skills)
      proficiency (smallint, NOT NULL, CHECK 1-5)
      certified (boolean, default false)
      certified_at (date, nullable)
      PK(employee_id, skill_id)

- [x] Define `leave_types` table:
      name (varchar(40), NOT NULL, UNIQUE)
      default_annual_days (numeric(5,2), NOT NULL, CHECK >= 0)
      + base columns

- [x] Define `leave_balances` table:
      employee_id (uuid, FK → employees)
      leave_type_id (uuid, FK → leave_types)
      year (smallint, NOT NULL)
      balance_days (numeric(5,2), NOT NULL, CHECK >= 0)
      UNIQUE(employee_id, leave_type_id, year)

- [x] Define `leave_requests` table:
      employee_id (uuid, FK → employees)
      leave_type_id (uuid, FK → leave_types)
      start_date (date, NOT NULL)
      end_date (date, NOT NULL) — CHECK >= start_date
      days (numeric(5,2), NOT NULL, CHECK > 0)
      reason (text, nullable)
      status (varchar(12), CHECK: pending/approved/rejected/cancelled, default 'pending')
      approver_id (uuid, nullable, FK → employees)
      decided_at (timestamptz, nullable)
      + base columns

- [x] Define `payroll_records` table:
      employee_id (uuid, FK → employees)
      period_month (smallint, CHECK 1-12)
      period_year (smallint)
      gross (numeric(14,2), NOT NULL, CHECK >= 0) — ENCRYPTED
      deductions (numeric(14,2), default 0, CHECK >= 0)
      net (numeric(14,2), NOT NULL, CHECK >= 0) — ENCRYPTED
      currency (char(3), NOT NULL)
      components (jsonb, nullable) — line breakdown
      generated_at (timestamptz, default now())
      UNIQUE(employee_id, period_year, period_month)
      + base columns

- [x] Define `performance_reviews` table:
      employee_id (uuid, FK → employees)
      reviewer_id (uuid, FK → employees)
      period (varchar(20), NOT NULL) — e.g. 2026-H1
      rating (smallint, nullable, CHECK 1-5)
      goals (jsonb, nullable)
      notes (text, nullable)
      + base columns
```

### Task 2.1.2 — Generate & Run Migration
```
- [x] Run: npx drizzle-kit generate
- [x] Review migration SQL
- [x] Run: npx drizzle-kit push
- [x] Verify all 10 tables created
```

### Task 2.1.3 — Seed HR Data
```
- [x] Seed default designations: CEO, CTO, COO, Project Manager, Senior Developer,
      Developer, ML Engineer, Data Scientist, Business Analyst, UI/UX Designer,
      QA Engineer, DevOps Engineer, HR Executive, Finance Executive, Sales Executive
- [x] Seed default departments: Engineering, Design, Sales, HR, Finance, Operations
- [x] Seed default leave types: Annual (14), Sick (7), Casual (7), Maternity (84), Paternity (3)
- [x] Seed default skills: JavaScript, TypeScript, Python, React, Next.js, PostgreSQL,
      Machine Learning, Docker, AWS, Figma, etc.
- [x] Create first Admin employee + user account for system bootstrap
```

### Task 2.1.4 — Indexes
```
- [x] employees(designation_id), employees(department_id), employees(manager_id)
- [x] employees(status) WHERE deleted_at IS NULL (partial index)
- [x] leave_requests(employee_id, status)
- [x] payroll_records(employee_id, period_year)
```

### Task 2.1.5 — RLS Policies
```
- [x] employees: HR/Admin → full access; Others → own record only (via employees_public view)
- [x] departments, designations, skills: Authenticated → read; Admin → write
- [x] leave_requests: Own → create/read own; Manager → decide; HR → full
- [x] payroll_records: HR/Admin only (every access audited)
- [x] performance_reviews: Own → read own; Manager/HR → full
```

### Task 2.1.6 — Encryption Implementation
**File: `src/server/lib/crypto.ts`**
```
- [x] Implement AES-256-GCM encrypt/decrypt functions
- [x] Apply to employee service: encrypt on write, decrypt on read
- [x] Fields: salary, bank_details (JSON → string → encrypt), national_id
- [x] Payroll: gross, net
- [x] Column-masking view: employees_public (excludes sensitive columns)
```

### Task 2.1.7 — Employee Code Generator
**File: `src/server/lib/code-generator.ts`**
```
- [x] generateEmployeeCode() → "SNX-0001", "SNX-0002", etc.
      - Query max existing code, increment
      - Pad with leading zeros
      - Handle concurrent creation (unique constraint as safety net)
```

---

## 2.2 Backend — HR Services & API Routes

### Task 2.2.1 — Employee Service
**File: `src/server/services/employee.service.ts`**
```
- [x] list(ctx, scope, params) → paginated employees
      - Apply scope: HR/Admin sees all, others see own
      - Sensitive fields included only for HR/Admin
      - Decrypt sensitive fields for HR/Admin
      - Filter/sort/paginate via helpers

- [x] create(ctx, input) → Employee (HR/Admin only)
      - Generate employee_code
      - Encrypt sensitive fields
      - Create user account (Supabase Auth)
      - Link user to employee
      - Assign default 'Employee' role
      - Initialize leave balances for current year
      - Audit: employee.create

- [x] getById(ctx, id) → Employee
      - Include/exclude sensitive fields based on role
      - Decrypt if authorized

- [x] update(ctx, id, input) → Employee
      - Encrypt sensitive fields if changed
      - Audit: employee.update (with before/after diff)

- [x] deactivate(ctx, id) → void (soft delete)
      - Set status = 'terminated', deleted_at = now()
      - Deactivate linked user account (is_active = false)
      - Revoke all user_roles
      - Preserve historical references
      - Audit: employee.deactivate

- [x] addSkill(ctx, employeeId, skillId, proficiency, certified) → void
      - Audit: employee.skill_add
```

### Task 2.2.2 — Leave Service
**File: `src/server/services/leave.service.ts`**
```
- [x] listRequests(ctx, scope, params) → paginated leave requests
- [x] createRequest(ctx, input) → LeaveRequest
      - Validate: days <= balance for type/year
      - Validate: start_date <= end_date
      - Audit: leave.request
- [x] decideRequest(ctx, id, decision) → LeaveRequest
      - decision: approved/rejected
      - Update balance if approved (deduct days)
      - Set approver_id, decided_at
      - Audit: leave.decision
- [x] getBalances(ctx, employeeId) → LeaveBalance[]
```

### Task 2.2.3 — HR Route Handlers
```
- [x] GET/POST    /api/employees              → list/create
- [x] GET/PATCH/DELETE /api/employees/:id      → get/update/deactivate
- [x] POST        /api/employees/:id/skills   → addSkill
- [x] GET/POST    /api/designations           → list/create
- [x] GET/POST    /api/departments            → list/create
- [x] GET/POST    /api/skills                 → list/create
- [x] GET/POST    /api/leave-types            → list/create
- [x] GET/POST    /api/leave-requests         → list/create
- [x] POST        /api/leave-requests/:id/decision → decide
- [x] GET         /api/leave-balances         → getBalances
- [x] GET/POST    /api/payroll                → list/create (HR only)
- [x] GET/POST    /api/performance-reviews    → list/create
```

---

## 2.3 Frontend — HR Module

### Task 2.3.1 — Data Table Component
**File: `src/components/data/data-table.tsx`**
```
- [x] Generic, reusable data table (TanStack Table v8):
      - Column definitions (sortable, filterable)
      - Pagination controls
      - Search input
      - Row actions dropdown
      - Bulk selection (future use)
      - Loading skeleton state
      - Empty state
      - Column visibility toggle
```

### Task 2.3.2 — Employee Pages
```
- [x] app/(dashboard)/hr/employees/page.tsx — Employee list
      - Data table with columns: Code, Name, Designation, Department, Status, Actions
      - Search by name/email/code
      - Filter by department, status, employment type
      - "Add Employee" button (HR/Admin only)

- [x] app/(dashboard)/hr/employees/new/page.tsx — Create employee form
      - Required: first_name, last_name, email, designation, employment_type, start_date
      - Optional: phone, department, manager (searchable select), salary, bank_details
      - Zod validation (shared with backend)
      - Success toast + redirect to employee detail

- [x] app/(dashboard)/hr/employees/[id]/page.tsx — Employee detail
      - Tabbed view: Overview | Skills | Leave | Payroll | Reviews
      - Overview tab: personal info, employment details, emergency contact
      - Sensitive fields: shown only to HR/Admin, with "eye" toggle
      - Skills tab: skills matrix with proficiency badges (1-5 stars)
      - Edit button → inline editing or modal
```

### Task 2.3.3 — Department & Designation Pages
```
- [x] app/(dashboard)/hr/departments/page.tsx — Simple list with add/edit
- [x] app/(dashboard)/hr/designations/page.tsx — Simple list with add/edit (Admin only)
```

### Task 2.3.4 — Leave Management Pages
```
- [x] app/(dashboard)/hr/leave/page.tsx — Leave requests list
      - Filter by status, employee, type, date range
      - Approve/reject actions inline (Manager/HR)
      - "Request Leave" button for all employees

- [x] Leave request form (dialog/modal):
      - Leave type selector
      - Date range picker
      - Days auto-calculated
      - Balance shown for selected type
      - Reason text area
```

### Task 2.3.5 — Payroll & Reviews Pages
```
- [x] app/(dashboard)/hr/payroll/page.tsx — Payroll records list (HR only)
      - Filter by employee, period
      - Generate payroll action

- [x] app/(dashboard)/hr/reviews/page.tsx — Performance reviews list
      - Filter by employee, period, rating
      - Create review form
```

---

## 2.4 Verification Checklist — Phase 2

```
- [x] Employees can be created (HR/Admin only)
- [x] Employee code auto-generated (SNX-0001, SNX-0002, ...)
- [x] User account created alongside employee
- [x] Default 'Employee' role assigned to new users
- [x] Sensitive fields (salary, bank_details, national_id) encrypted in DB
- [x] Sensitive fields visible only to HR/Admin
- [x] Non-HR users see only public employee info
- [x] Employees can be deactivated (soft delete)
- [x] Deactivation cascades to user account + roles
- [x] Historical references preserved after deactivation
- [x] Designations configurable (Admin only)
- [x] Departments configurable
- [x] Skills matrix working (attach skills with proficiency)
- [x] Leave types configurable with default days
- [x] Leave balances initialized on employee creation
- [x] Leave requests: create, approve, reject working
- [x] Leave balance deducted on approval
- [x] Leave request cannot exceed balance
- [x] Payroll records: create and view (HR only, audited)
- [x] Performance reviews: create and view
- [x] All CRUD operations audited
- [x] RLS policies enforcing access at DB level
- [x] All new endpoints have Zod validation
- [x] CI passing, deployment successful
```

---

*Phase 2 completion = Milestone M2 (People Ready). Proceed to Phase 3 (CRM + Sales).*
