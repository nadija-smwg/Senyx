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
- [ ] Define `departments` table:
      name (varchar(80), NOT NULL, UNIQUE)
      description (text, nullable)
      + base columns

- [ ] Define `designations` table:
      title (varchar(80), NOT NULL, UNIQUE) — job title, grants NO permissions
      description (text, nullable)
      + base columns

- [ ] Define `employees` table (SINGLE SOURCE OF TRUTH FOR PEOPLE):
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

- [ ] Define `skills` table:
      name (varchar(60), NOT NULL, UNIQUE)
      category (varchar(40), nullable)
      + base columns

- [ ] Define `employee_skills` join table:
      employee_id (uuid, NOT NULL, FK → employees)
      skill_id (uuid, NOT NULL, FK → skills)
      proficiency (smallint, NOT NULL, CHECK 1-5)
      certified (boolean, default false)
      certified_at (date, nullable)
      PK(employee_id, skill_id)

- [ ] Define `leave_types` table:
      name (varchar(40), NOT NULL, UNIQUE)
      default_annual_days (numeric(5,2), NOT NULL, CHECK >= 0)
      + base columns

- [ ] Define `leave_balances` table:
      employee_id (uuid, FK → employees)
      leave_type_id (uuid, FK → leave_types)
      year (smallint, NOT NULL)
      balance_days (numeric(5,2), NOT NULL, CHECK >= 0)
      UNIQUE(employee_id, leave_type_id, year)

- [ ] Define `leave_requests` table:
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

- [ ] Define `payroll_records` table:
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

- [ ] Define `performance_reviews` table:
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
- [ ] Run: npx drizzle-kit generate
- [ ] Review migration SQL
- [ ] Run: npx drizzle-kit push
- [ ] Verify all 10 tables created
```

### Task 2.1.3 — Seed HR Data
```
- [ ] Seed default designations: CEO, CTO, COO, Project Manager, Senior Developer,
      Developer, ML Engineer, Data Scientist, Business Analyst, UI/UX Designer,
      QA Engineer, DevOps Engineer, HR Executive, Finance Executive, Sales Executive
- [ ] Seed default departments: Engineering, Design, Sales, HR, Finance, Operations
- [ ] Seed default leave types: Annual (14), Sick (7), Casual (7), Maternity (84), Paternity (3)
- [ ] Seed default skills: JavaScript, TypeScript, Python, React, Next.js, PostgreSQL,
      Machine Learning, Docker, AWS, Figma, etc.
- [ ] Create first Admin employee + user account for system bootstrap
```

### Task 2.1.4 — Indexes
```
- [ ] employees(designation_id), employees(department_id), employees(manager_id)
- [ ] employees(status) WHERE deleted_at IS NULL (partial index)
- [ ] leave_requests(employee_id, status)
- [ ] payroll_records(employee_id, period_year)
```

### Task 2.1.5 — RLS Policies
```
- [ ] employees: HR/Admin → full access; Others → own record only (via employees_public view)
- [ ] departments, designations, skills: Authenticated → read; Admin → write
- [ ] leave_requests: Own → create/read own; Manager → decide; HR → full
- [ ] payroll_records: HR/Admin only (every access audited)
- [ ] performance_reviews: Own → read own; Manager/HR → full
```

### Task 2.1.6 — Encryption Implementation
**File: `src/server/lib/crypto.ts`**
```
- [ ] Implement AES-256-GCM encrypt/decrypt functions
- [ ] Apply to employee service: encrypt on write, decrypt on read
- [ ] Fields: salary, bank_details (JSON → string → encrypt), national_id
- [ ] Payroll: gross, net
- [ ] Column-masking view: employees_public (excludes sensitive columns)
```

### Task 2.1.7 — Employee Code Generator
**File: `src/server/lib/code-generator.ts`**
```
- [ ] generateEmployeeCode() → "SNX-0001", "SNX-0002", etc.
      - Query max existing code, increment
      - Pad with leading zeros
      - Handle concurrent creation (unique constraint as safety net)
```

---

## 2.2 Backend — HR Services & API Routes

### Task 2.2.1 — Employee Service
**File: `src/server/services/employee.service.ts`**
```
- [ ] list(ctx, scope, params) → paginated employees
      - Apply scope: HR/Admin sees all, others see own
      - Sensitive fields included only for HR/Admin
      - Decrypt sensitive fields for HR/Admin
      - Filter/sort/paginate via helpers

- [ ] create(ctx, input) → Employee (HR/Admin only)
      - Generate employee_code
      - Encrypt sensitive fields
      - Create user account (Supabase Auth)
      - Link user to employee
      - Assign default 'Employee' role
      - Initialize leave balances for current year
      - Audit: employee.create

- [ ] getById(ctx, id) → Employee
      - Include/exclude sensitive fields based on role
      - Decrypt if authorized

- [ ] update(ctx, id, input) → Employee
      - Encrypt sensitive fields if changed
      - Audit: employee.update (with before/after diff)

- [ ] deactivate(ctx, id) → void (soft delete)
      - Set status = 'terminated', deleted_at = now()
      - Deactivate linked user account (is_active = false)
      - Revoke all user_roles
      - Preserve historical references
      - Audit: employee.deactivate

- [ ] addSkill(ctx, employeeId, skillId, proficiency, certified) → void
      - Audit: employee.skill_add
```

### Task 2.2.2 — Leave Service
**File: `src/server/services/leave.service.ts`**
```
- [ ] listRequests(ctx, scope, params) → paginated leave requests
- [ ] createRequest(ctx, input) → LeaveRequest
      - Validate: days <= balance for type/year
      - Validate: start_date <= end_date
      - Audit: leave.request
- [ ] decideRequest(ctx, id, decision) → LeaveRequest
      - decision: approved/rejected
      - Update balance if approved (deduct days)
      - Set approver_id, decided_at
      - Audit: leave.decision
- [ ] getBalances(ctx, employeeId) → LeaveBalance[]
```

### Task 2.2.3 — HR Route Handlers
```
- [ ] GET/POST    /api/employees              → list/create
- [ ] GET/PATCH/DELETE /api/employees/:id      → get/update/deactivate
- [ ] POST        /api/employees/:id/skills   → addSkill
- [ ] GET/POST    /api/designations           → list/create
- [ ] GET/POST    /api/departments            → list/create
- [ ] GET/POST    /api/skills                 → list/create
- [ ] GET/POST    /api/leave-types            → list/create
- [ ] GET/POST    /api/leave-requests         → list/create
- [ ] POST        /api/leave-requests/:id/decision → decide
- [ ] GET         /api/leave-balances         → getBalances
- [ ] GET/POST    /api/payroll                → list/create (HR only)
- [ ] GET/POST    /api/performance-reviews    → list/create
```

---

## 2.3 Frontend — HR Module

### Task 2.3.1 — Data Table Component
**File: `src/components/data/data-table.tsx`**
```
- [ ] Generic, reusable data table (TanStack Table v8):
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
- [ ] app/(dashboard)/hr/employees/page.tsx — Employee list
      - Data table with columns: Code, Name, Designation, Department, Status, Actions
      - Search by name/email/code
      - Filter by department, status, employment type
      - "Add Employee" button (HR/Admin only)

- [ ] app/(dashboard)/hr/employees/new/page.tsx — Create employee form
      - Required: first_name, last_name, email, designation, employment_type, start_date
      - Optional: phone, department, manager (searchable select), salary, bank_details
      - Zod validation (shared with backend)
      - Success toast + redirect to employee detail

- [ ] app/(dashboard)/hr/employees/[id]/page.tsx — Employee detail
      - Tabbed view: Overview | Skills | Leave | Payroll | Reviews
      - Overview tab: personal info, employment details, emergency contact
      - Sensitive fields: shown only to HR/Admin, with "eye" toggle
      - Skills tab: skills matrix with proficiency badges (1-5 stars)
      - Edit button → inline editing or modal
```

### Task 2.3.3 — Department & Designation Pages
```
- [ ] app/(dashboard)/hr/departments/page.tsx — Simple list with add/edit
- [ ] app/(dashboard)/hr/designations/page.tsx — Simple list with add/edit (Admin only)
```

### Task 2.3.4 — Leave Management Pages
```
- [ ] app/(dashboard)/hr/leave/page.tsx — Leave requests list
      - Filter by status, employee, type, date range
      - Approve/reject actions inline (Manager/HR)
      - "Request Leave" button for all employees

- [ ] Leave request form (dialog/modal):
      - Leave type selector
      - Date range picker
      - Days auto-calculated
      - Balance shown for selected type
      - Reason text area
```

### Task 2.3.5 — Payroll & Reviews Pages
```
- [ ] app/(dashboard)/hr/payroll/page.tsx — Payroll records list (HR only)
      - Filter by employee, period
      - Generate payroll action

- [ ] app/(dashboard)/hr/reviews/page.tsx — Performance reviews list
      - Filter by employee, period, rating
      - Create review form
```

---

## 2.4 Verification Checklist — Phase 2

```
- [ ] Employees can be created (HR/Admin only)
- [ ] Employee code auto-generated (SNX-0001, SNX-0002, ...)
- [ ] User account created alongside employee
- [ ] Default 'Employee' role assigned to new users
- [ ] Sensitive fields (salary, bank_details, national_id) encrypted in DB
- [ ] Sensitive fields visible only to HR/Admin
- [ ] Non-HR users see only public employee info
- [ ] Employees can be deactivated (soft delete)
- [ ] Deactivation cascades to user account + roles
- [ ] Historical references preserved after deactivation
- [ ] Designations configurable (Admin only)
- [ ] Departments configurable
- [ ] Skills matrix working (attach skills with proficiency)
- [ ] Leave types configurable with default days
- [ ] Leave balances initialized on employee creation
- [ ] Leave requests: create, approve, reject working
- [ ] Leave balance deducted on approval
- [ ] Leave request cannot exceed balance
- [ ] Payroll records: create and view (HR only, audited)
- [ ] Performance reviews: create and view
- [ ] All CRUD operations audited
- [ ] RLS policies enforcing access at DB level
- [ ] All new endpoints have Zod validation
- [ ] CI passing, deployment successful
```

---

*Phase 2 completion = Milestone M2 (People Ready). Proceed to Phase 3 (CRM + Sales).*
