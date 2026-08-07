# Phase 4 — Projects (Core + Board + Time + Payments)

**Duration:** 3–4 weeks (largest phase)  
**Dependencies:** Phase 1 (Auth), Phase 2 (HR for assignments), Phase 3 (Sales for deal→project flow)  
**Tables:** 9 — `projects`, `project_assignments`, `board_columns`, `tasks`, `milestones`, `payment_milestones`, `time_entries`, `clock_sessions`, `project_risks`  
**API Routes:** 25  

---

## 4.1 Database Schema — Projects

### Task 4.1.1 — Create Drizzle Schema: Projects

**File: `src/server/db/schema/projects.ts`**

```
- [ ] Define `projects` table:
      code (varchar(20), NOT NULL, UNIQUE) — e.g. PRJ-0007
      name (varchar(140), NOT NULL)
      type (varchar(10), CHECK: solution/product)
      account_id (uuid, nullable, FK → accounts) — required when type=solution
      deal_id (uuid, nullable, FK → deals) — source deal
      owner_id (uuid, NOT NULL, FK → employees) — Project Owner
      billing_type (varchar(15), CHECK: fixed/time_materials/retainer)
      status (varchar(12), CHECK: planning/active/on_hold/completed/cancelled, default 'planning')
      start_date (date, nullable)
      end_date (date, nullable) — CHECK >= start_date
      budget (numeric(14,2), nullable, CHECK >= 0)
      currency (char(3), NOT NULL)
      CHECK: type = 'product' OR account_id IS NOT NULL
      + base columns

- [ ] Define `project_assignments` table:
      project_id (uuid, FK → projects)
      employee_id (uuid, FK → employees)
      role_on_project (varchar(40), nullable) — e.g. Developer, QA
      allocation_pct (numeric(5,2), nullable, CHECK 0-100)
      assigned_at (timestamptz, default now())
      unassigned_at (timestamptz, nullable)
      UNIQUE(project_id, employee_id) WHERE unassigned_at IS NULL
      + base columns

- [ ] Define `board_columns` table:
      project_id (uuid, FK → projects)
      name (varchar(40), NOT NULL)
      position (smallint, NOT NULL) — order left-to-right
      wip_limit (smallint, nullable, CHECK >= 0)
      UNIQUE(project_id, position)
      + base columns

- [ ] Define `tasks` table:
      project_id (uuid, FK → projects)
      column_id (uuid, FK → board_columns) — current board column
      parent_task_id (uuid, nullable, FK → tasks) — subtask support
      title (varchar(200), NOT NULL)
      description (text, nullable)
      assignee_id (uuid, nullable, FK → employees)
      priority (varchar(8), CHECK: low/medium/high/urgent, default 'medium')
      status (varchar(12), CHECK: todo/in_progress/review/done/blocked, default 'todo')
      estimate_hours (numeric(6,2), nullable, CHECK >= 0)
      due_date (date, nullable)
      position (integer, default 0) — order within column
      + base columns

- [ ] Define `milestones` table (delivery milestones):
      project_id (uuid, FK → projects)
      name (varchar(120), NOT NULL)
      description (text, nullable)
      due_date (date, nullable)
      status (varchar(12), CHECK: pending/in_progress/completed, default 'pending')
      completed_at (timestamptz, nullable)
      + base columns

- [ ] Define `payment_milestones` table:
      project_id (uuid, FK → projects)
      name (varchar(80), NOT NULL)
      phase (varchar(60), nullable) — linked phase label
      sequence (smallint, NOT NULL) — order of collection
      percentage (numeric(5,2), CHECK 0-100) — SUM per project = 100
      amount (numeric(14,2), CHECK >= 0) — project value × percentage
      currency (char(3), NOT NULL)
      status (varchar(10), CHECK: pending/due/invoiced/paid, default 'pending')
      expected_date (date, nullable)
      invoice_id (uuid, nullable, FK → invoices) — set when invoiced
      completed_at (timestamptz, nullable)
      UNIQUE(project_id, sequence)
      + base columns

- [ ] Define `time_entries` table:
      project_id (uuid, FK → projects)
      task_id (uuid, nullable, FK → tasks)
      employee_id (uuid, FK → employees)
      work_date (date, NOT NULL) — not in future
      hours (numeric(6,2), NOT NULL, CHECK > 0 AND <= 24)
      description (text, nullable)
      billable (boolean, default true)
      source (varchar(6), CHECK: manual/clock, default 'manual')
      clock_session_id (uuid, nullable, FK → clock_sessions)
      + base columns

- [ ] Define `clock_sessions` table:
      project_id (uuid, FK → projects)
      task_id (uuid, nullable, FK → tasks)
      employee_id (uuid, FK → employees)
      clock_in_at (timestamptz, default now())
      clock_out_at (timestamptz, nullable) — CHECK > clock_in_at
      duration_seconds (integer, nullable, CHECK >= 0)
      is_active (boolean, default true)
      UNIQUE(employee_id) WHERE is_active = true — ONE ACTIVE CLOCK PER PERSON
      + base columns

- [ ] Define `project_risks` table:
      project_id (uuid, FK → projects)
      title (varchar(160), NOT NULL)
      description (text, nullable)
      severity (varchar(8), CHECK: low/medium/high/critical)
      status (varchar(10), CHECK: open/mitigating/closed, default 'open')
      owner_id (uuid, nullable, FK → employees)
      + base columns

- [ ] Create trigger: validate_payment_milestone_sum() — SUM(%) per project <= 100
- [ ] Create trigger: compute_clock_duration() — on clock_out, compute duration
```

### Task 4.1.2 — Generate & Run Migration
```
- [ ] npx drizzle-kit generate
- [ ] npx drizzle-kit push
- [ ] Verify all 9 tables created
```

### Task 4.1.3 — Seed Default Board Columns
```
- [ ] Template columns for new projects: Backlog, To Do, In Progress, Review, Done
      (created per-project on project creation)
```

### Task 4.1.4 — Indexes
```
- [ ] projects(account_id), projects(deal_id), projects(owner_id), projects(status)
- [ ] project_assignments(project_id), project_assignments(employee_id)
- [ ] board_columns(project_id, position)
- [ ] tasks(project_id, column_id, position) — board composite index
- [ ] tasks(assignee_id), tasks(due_date)
- [ ] milestones(project_id, status)
- [ ] payment_milestones(project_id, status)
- [ ] time_entries(project_id, employee_id), time_entries(work_date)
- [ ] clock_sessions: UNIQUE(employee_id) WHERE is_active = true (partial)
- [ ] project_risks(project_id)
```

### Task 4.1.5 — RLS Policies
```
- [ ] projects: Owner → full access to owned; Assigned → view assigned; Admin → all
- [ ] tasks: Same as parent project scope
- [ ] time_entries: Own → create/view own; Owner/Admin → view project time
- [ ] clock_sessions: Own → clock in/out; Admin → view all
- [ ] payment_milestones: Owner + Finance + Admin
```

---

## 4.2 Backend — Project Services

### Task 4.2.1 — Project Service
**File: `src/server/services/project.service.ts`**
```
- [ ] list(ctx, scope, params) → paginated projects
      - Scope filtering: own, assigned (via project_assignments), all
      - Include: task count, team size, completion %, budget vs actual

- [ ] create(ctx, input) → Project
      - Generate project code (PRJ-0001, ...)
      - Validate: solutions require account_id
      - Create default board columns (Backlog/ToDo/InProgress/Review/Done)
      - If from deal: link deal_id, copy account_id
      - Audit: project.create

- [ ] getById(ctx, id) → Project with summary
      - Include: assignments, milestone status, payment status, time totals

- [ ] update(ctx, id, input) → Project (audited)

- [ ] delete(ctx, id) → void (soft, admin only, audited)

- [ ] getBoard(ctx, projectId) → { columns: [{ ...column, tasks: Task[] }] }
      - Return columns ordered by position
      - Each column includes its tasks ordered by position

- [ ] getSummary(ctx, projectId) → Project Owner dashboard data
      - Board status (tasks per column)
      - Upcoming/overdue due dates
      - Total time logged (billable/non-billable)
      - Payment milestones (collected/due/overdue totals)
      - Budget vs actual
      - Team members
```

### Task 4.2.2 — Task Service
**File: `src/server/services/task.service.ts`**
```
- [ ] list(ctx, projectId, params) → tasks (filterable)
- [ ] create(ctx, projectId, input) → Task
      - Set column_id to first column (Backlog) by default
      - Set position to next in column
      - Audit: task.create

- [ ] update(ctx, taskId, input) → Task (audited)

- [ ] moveTask(ctx, taskId, newColumnId, newPosition) → Task
      - Update column_id and position
      - Reorder other tasks in source and target columns
      - Audit: task.move (critical — record column change)
      - Optimistic: designed for sub-1s response
```

### Task 4.2.3 — Assignment Service
```
- [ ] listAssignments(ctx, projectId) → assignments with employee details
- [ ] assign(ctx, projectId, employeeId, roleOnProject, allocationPct) → Assignment
      - Validate employee exists (HR reference)
      - Check not already actively assigned
      - Audit: assignment.create
- [ ] unassign(ctx, assignmentId) → void
      - Set unassigned_at = now()
      - Audit: assignment.remove
```

### Task 4.2.4 — Milestone Service
**File: `src/server/services/milestone.service.ts`**
```
- [ ] listMilestones(ctx, projectId) → delivery milestones
- [ ] createMilestone(ctx, projectId, input) → Milestone (audited)
- [ ] completeMilestone(ctx, milestoneId) → Milestone
      - Set status = 'completed', completed_at = now()
      - Find matching payment_milestone (by phase)
      - Set payment_milestone.status = 'due'
      - Create draft invoice (→ Finance Phase 5 integration)
      - Audit: milestone.complete

- [ ] listPaymentMilestones(ctx, projectId) → payment milestones
- [ ] createPaymentMilestone(ctx, projectId, input) → PaymentMilestone
      - Validate SUM(percentage) will not exceed 100
      - Calculate amount = project.budget × percentage / 100
      - Audit: payment_milestone.create
```

### Task 4.2.5 — Time Service
**File: `src/server/services/time.service.ts`**
```
- [ ] listTimeEntries(ctx, projectId, params) → time entries
      - Filter by employee, date range, billable
      - Include totals: total hours, billable hours

- [ ] logTime(ctx, projectId, input) → TimeEntry
      - Validate: work_date not in future
      - Validate: hours > 0 && <= 24
      - source = 'manual'
      - Audit: time.log

- [ ] clockIn(ctx, projectId, taskId?) → ClockSession
      - CHECK: no active clock for this employee (partial unique index)
      - Create clock_session with is_active=true
      - Audit: clock.in

- [ ] clockOut(ctx) → ClockSession + TimeEntry
      - Find active clock for current employee
      - Set clock_out_at = now(), compute duration_seconds
      - Set is_active = false
      - Optionally create time_entry (source='clock', hours from duration)
      - Audit: clock.out

- [ ] getActiveClock(ctx) → ClockSession | null
      - Return current employee's active clock (for topbar widget)
```

### Task 4.2.6 — Project Risk Service
```
- [ ] listRisks(ctx, projectId) → risks
- [ ] createRisk(ctx, projectId, input) → Risk (audited)
- [ ] updateRisk(ctx, riskId, input) → Risk (audited)
```

### Task 4.2.7 — Project Code Generator
```
- [ ] generateProjectCode() → "PRJ-0001", "PRJ-0002", ...
```

### Task 4.2.8 — Route Handlers (25 routes)
```
Projects:
- [ ] GET/POST         /api/projects                      → list/create
- [ ] GET/PATCH/DELETE  /api/projects/:id                  → get/update/delete
- [ ] GET               /api/projects/:id/board            → getBoard
- [ ] GET               /api/projects/:id/summary          → getSummary

Board & Tasks:
- [ ] POST              /api/projects/:id/columns          → createColumn
- [ ] GET/POST          /api/projects/:id/tasks            → list/create tasks
- [ ] PATCH             /api/tasks/:id                     → updateTask
- [ ] POST              /api/tasks/:id/move                → moveTask

Assignments:
- [ ] GET/POST          /api/projects/:id/assignments      → list/assign

Milestones:
- [ ] GET/POST          /api/projects/:id/milestones       → list/create
- [ ] POST              /api/milestones/:id/complete        → complete
- [ ] GET/POST          /api/projects/:id/payment-milestones → list/create

Time:
- [ ] GET/POST          /api/projects/:id/time-entries     → list/log
- [ ] POST              /api/projects/:id/clock/in         → clockIn
- [ ] POST              /api/clock/out                     → clockOut

Risks:
- [ ] GET/POST          /api/projects/:id/risks            → list/create
```

---

## 4.3 Frontend — Projects Module

### Task 4.3.1 — Projects List Page
```
- [ ] app/(dashboard)/projects/page.tsx
      - Data table: Code, Name, Type, Client, Owner, Status, Progress, Actions
      - Filters: type (solution/product), status, owner, billing_type
      - "My Projects" quick filter (assigned to me)
      - "Add Project" button
```

### Task 4.3.2 — Project Detail Page (Tabbed)
```
- [ ] app/(dashboard)/projects/[id]/page.tsx — Overview
      - Project header: code, name, type badge, status badge
      - Key metrics: budget, time logged, % complete, payment collected
      - Quick actions: edit, change status

- [ ] app/(dashboard)/projects/[id]/board/page.tsx — Kanban Board
      → See Task 4.3.3

- [ ] app/(dashboard)/projects/[id]/tasks/page.tsx — Task list view
      - Sortable/filterable table of all tasks
      - Alternative to board view

- [ ] app/(dashboard)/projects/[id]/team/page.tsx — Team/Assignments
      - List of assigned team members
      - Role on project, allocation %
      - Assign/unassign actions

- [ ] app/(dashboard)/projects/[id]/milestones/page.tsx — Delivery milestones
      - Timeline view
      - Complete milestone action → triggers payment

- [ ] app/(dashboard)/projects/[id]/payments/page.tsx — Payment schedule
      - Table: milestone name, phase, %, amount, status, expected date
      - Visual: progress bar of collected vs total
      - Status badges: pending, due, invoiced, paid
      - Sum validation (100%)

- [ ] app/(dashboard)/projects/[id]/time/page.tsx — Time tracking
      - Time entries list (filterable by employee, date, billable)
      - Totals: total hours, billable hours, per-employee breakdown
      - "Log Time" button → form modal

- [ ] app/(dashboard)/projects/[id]/risks/page.tsx — Risk/issue log
      - Table with severity, status, owner
      - Add risk form

- [ ] app/(dashboard)/projects/[id]/documents/page.tsx — Project documents
      - Placeholder for Phase 8 integration
```

### Task 4.3.3 — Kanban Board (Critical Feature)
**Components: `src/components/board/`**
```
- [ ] kanban-board.tsx — Main board container
      - Uses @dnd-kit for drag-and-drop
      - Renders columns with tasks
      - Handles drag start/over/end events
      - Optimistic updates: move card immediately, persist async
      - Rollback on failure with toast error

- [ ] board-column.tsx — Single column
      - Column header: name, task count, WIP limit indicator
      - Droppable area for tasks
      - "Add Task" button at bottom
      - Visual warning when WIP limit exceeded (amber border)

- [ ] task-card.tsx — Draggable task card
      - Title (truncated)
      - Assignee avatar
      - Priority badge (color-coded: 🔴 urgent, 🟠 high, 🟡 medium, 🟢 low)
      - Due date (red if overdue)
      - Estimate hours
      - Click → opens task detail modal

- [ ] task-detail-modal.tsx — Full task editing
      - Title, description (rich text or markdown)
      - Assignee (searchable employee select)
      - Priority, status
      - Estimate hours, due date
      - Subtasks list
      - Time entries on this task
      - Activity history (from audit log)
      - Delete (soft) action
```

### Task 4.3.4 — Board Swimlanes & Filters
```
- [ ] Filter bar above board:
      - Filter by assignee (multi-select)
      - Filter by priority
      - Filter by due date (overdue, this week, etc.)
      - Search by task title
- [ ] Swimlane toggle:
      - By assignee: group rows by person
      - By priority: group rows by priority
      - None: flat board (default)
```

### Task 4.3.5 — Time Clock Widget (Topbar)
**File: `src/components/clock/time-clock.tsx`**
```
- [ ] Persistent widget in topbar (visible on all pages)
- [ ] States:
      A) No active clock: "Clock In" button + project selector dropdown
      B) Clocked in: project name, elapsed time (live counter), "Clock Out" button
- [ ] Clock in: select project (and optional task) → POST clock/in
- [ ] Clock out: POST clock/out → show duration, success toast
- [ ] Polling or websocket for active clock state
```

**File: `src/hooks/use-clock.ts`**
```
- [ ] useActiveClock() — Returns active clock session, elapsed time, clock in/out actions
      - Polls /api/auth/me or dedicated endpoint for active clock
      - Computes live elapsed time client-side
```

### Task 4.3.6 — Time Entry Form
**File: `src/components/clock/time-entry-form.tsx`**
```
- [ ] Manual time logging form (dialog):
      - Project (auto-selected if on project page)
      - Task (optional, from project tasks)
      - Date (date picker, default today, not future)
      - Hours (number input, 0.25 – 24)
      - Description (text)
      - Billable toggle (default on)
```

### Task 4.3.7 — Deal → Project Creation Flow
```
- [ ] When a deal is closed as Won (from Phase 3):
      - Modal/wizard: "Create Project from Deal"
      - Pre-filled: name from deal, account from deal, type=solution
      - User sets: billing type, Project Owner, start/end dates, budget
      - Second step: configure payment milestones (e.g. 30%/20%/30%/20%)
      - Validate milestones sum to 100%
      - Create project → assign owner → create milestones
```

---

## 4.4 Verification Checklist — Phase 4

```
- [x] Projects: CRUD working with solution/product types
- [x] Project code auto-generated (PRJ-0001, ...)
- [x] Solutions require account_id (validated)
- [x] Deal → Project creation flow working (from won deals)
- [x] Project Owner assigned and visible
- [x] Default board columns created on new project
- [x] Kanban board rendering correctly
- [x] Drag-and-drop: cards move between columns
- [x] Optimistic updates: move feels instant (<1s persistence)
- [x] Column changes recorded in audit log (task.move)
- [x] Task CRUD: create, edit, priority, assignee, due date
- [x] Subtasks working (parent_task_id)
- [x] Swimlanes: filter by assignee, priority
- [x] Board filters: assignee, priority, search
- [x] Team assignments: assign/unassign employees to projects
- [x] Delivery milestones: create, complete
- [x] Payment milestones: create with percentages summing to 100%
- [x] Milestone completion → payment milestone status = 'due'
- [x] Draft invoice creation stub ready (Phase 5 integration)
- [x] Manual time entries working (date, hours, billable)
- [x] Clock in/out working (one active per employee enforced)
- [x] Clock widget in topbar showing active session
- [x] Time totals correct (per employee, per project)
- [x] Project risks: CRUD working
- [x] Project summary/dashboard data endpoint working
- [x] All operations audited
- [x] RLS policies enforcing scope
- [x] CI passing, deployed
```

---

*Phase 4 completion = Milestone M4 (Project Delivery). Proceed to Phase 5 (Finance).*
