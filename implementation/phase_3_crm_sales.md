# Phase 3 — CRM & Sales

**Duration:** 2–3 weeks  
**Dependencies:** Phase 1 (Auth/RBAC), Phase 2 (HR/People for employee references)  
**Tables:** 8 — `accounts`, `contacts`, `interactions`, `activities`, `tags`, `taggables`, `deals`, `deal_stage_history`, `quotes`  
**API Routes:** 20  

---

## 3.1 Database Schema — CRM

### Task 3.1.1 — Create Drizzle Schema: CRM

**File: `src/server/db/schema/crm.ts`**

```
- [ ] Define `accounts` table (client companies):
      name (varchar(120), NOT NULL)
      industry (varchar(60), nullable)
      size (varchar(20), nullable) — e.g. 1-10, 11-50
      website (varchar(200), nullable) — valid URL
      address (jsonb, nullable) — {line1, city, country}
      status (varchar(12), CHECK: prospect/active/inactive, default 'prospect')
      owner_id (uuid, nullable, FK → employees) — relationship owner
      + base columns

- [ ] Define `contacts` table:
      account_id (uuid, NOT NULL, FK → accounts)
      first_name (varchar(60), NOT NULL)
      last_name (varchar(60), nullable)
      email (citext, nullable) — valid email
      phone (varchar(30), nullable)
      title (varchar(80), nullable)
      is_primary (boolean, default false)
      + base columns

- [ ] Define `interactions` table:
      account_id (uuid, nullable, FK → accounts)
      contact_id (uuid, nullable, FK → contacts)
      type (varchar(10), CHECK: call/email/meeting/note)
      subject (varchar(160), NOT NULL)
      notes (text, nullable)
      occurred_at (timestamptz, default now())
      logged_by (uuid, NOT NULL, FK → employees)
      CHECK: account_id IS NOT NULL OR contact_id IS NOT NULL
      + base columns

- [ ] Define `activities` table (polymorphic follow-up tasks):
      subject (varchar(160), NOT NULL)
      type (varchar(20), nullable) — call/email/todo
      due_date (timestamptz, nullable)
      assignee_id (uuid, nullable, FK → employees)
      related_type (varchar(30), nullable) — account/deal/project
      related_id (uuid, nullable) — polymorphic target
      status (varchar(12), CHECK: open/in_progress/done/cancelled, default 'open')
      + base columns

- [ ] Define `tags` table:
      name (varchar(40), NOT NULL, UNIQUE)
      + base columns

- [ ] Define `taggables` table (polymorphic join):
      tag_id (uuid, FK → tags, ON DELETE CASCADE)
      taggable_type (varchar(30), NOT NULL)
      taggable_id (uuid, NOT NULL)
      PK(tag_id, taggable_type, taggable_id)
```

### Task 3.1.2 — Create Drizzle Schema: Sales

**File: `src/server/db/schema/sales.ts`**

```
- [ ] Define `deals` table:
      name (varchar(140), NOT NULL)
      account_id (uuid, NOT NULL, FK → accounts)
      owner_id (uuid, NOT NULL, FK → employees) — "whose sale" — any employee
      amount (numeric(14,2), NOT NULL, CHECK >= 0)
      currency (char(3), NOT NULL)
      stage (varchar(14), CHECK: lead/qualified/proposal/negotiation/won/lost, default 'lead')
      probability (numeric(5,2), default 0, CHECK 0-100)
      expected_close_date (date, nullable)
      source (varchar(40), nullable)
      status (varchar(6), CHECK: open/won/lost, default 'open')
      win_loss_reason (text, nullable) — required when won/lost
      last_activity_at (timestamptz, nullable)
      closed_at (timestamptz, nullable)
      + base columns

- [ ] Define `deal_stage_history` table (append-only):
      id (uuid PK)
      deal_id (uuid, NOT NULL, FK → deals)
      from_stage (varchar(14), nullable) — null for initial creation
      to_stage (varchar(14), NOT NULL)
      changed_by (uuid, NOT NULL, FK → users)
      changed_at (timestamptz, default now())
      created_at (timestamptz, default now())

- [ ] Define `quotes` table:
      deal_id (uuid, NOT NULL, FK → deals)
      amount (numeric(14,2), NOT NULL, CHECK >= 0)
      currency (char(3), NOT NULL)
      valid_until (date, nullable)
      status (varchar(12), default 'draft') — draft/sent/accepted/rejected
      document_id (uuid, nullable, FK → documents)
      + base columns
```

### Task 3.1.3 — Generate & Run Migration
```
- [ ] npx drizzle-kit generate
- [ ] npx drizzle-kit push
- [ ] Verify all 8 tables created
```

### Task 3.1.4 — Indexes
```
- [ ] accounts(owner_id), accounts(status) WHERE deleted_at IS NULL
- [ ] contacts(account_id)
- [ ] interactions(account_id), interactions(contact_id)
- [ ] activities(assignee_id), activities(related_type, related_id)
- [ ] deals(account_id), deals(owner_id), deals(stage), deals(status)
- [ ] deals(owner_id, stage) — composite for scoped pipeline
- [ ] deals(status, expected_close_date)
- [ ] deal_stage_history(deal_id, changed_at)
- [ ] Full-text search GIN: accounts(name), deals(name)
```

### Task 3.1.5 — RLS Policies
```
- [ ] accounts: All authenticated users can view/create (CRM is shared)
- [ ] contacts: Same as accounts (shared CRM)
- [ ] deals: 'own' scope → owner_id = current_employee; 'all' scope → Sales Lead/Admin
- [ ] quotes: Same scope as parent deal
```

---

## 3.2 Backend — CRM & Sales Services

### Task 3.2.1 — CRM Service
**File: `src/server/services/crm.service.ts`**
```
- [ ] listAccounts(ctx, params) → paginated accounts
- [ ] createAccount(ctx, input) → Account (audited)
- [ ] getAccount(ctx, id) → Account with contacts
- [ ] updateAccount(ctx, id, input) → Account (audited)
- [ ] deleteAccount(ctx, id) → void (soft, audited)

- [ ] listContacts(ctx, params) → paginated contacts
- [ ] createContact(ctx, input) → Contact (audited)
      - Validate: one primary per account (app-level)

- [ ] listInteractions(ctx, params) → interactions (by account/contact)
- [ ] createInteraction(ctx, input) → Interaction (audited)
      - Update deal.last_activity_at if related to a deal

- [ ] listActivities(ctx, params) → activities
- [ ] createActivity(ctx, input) → Activity (audited)
- [ ] updateActivity(ctx, id, input) → Activity (audited)
```

### Task 3.2.2 — Deal Service
**File: `src/server/services/deal.service.ts`**
```
- [ ] listDeals(ctx, scope, params) → paginated deals
      - 'own' scope: filter by owner_id = current employee
      - 'all' scope: Sales Lead/Admin — no filter
      - Include computed: days_in_stage, days_since_last_activity, risk_flag
      - Support pipeline view (grouped by stage)

- [ ] createDeal(ctx, input) → Deal
      - owner_id = current employee (anyone can create)
      - Initial stage = 'lead'
      - Write first deal_stage_history entry (from_stage=null, to_stage='lead')
      - Audit: deal.create

- [ ] getDeal(ctx, id) → Deal with stage history, linked account
      - Include computed health indicators

- [ ] updateDeal(ctx, id, input) → Deal
      - Audit: deal.update (before/after)

- [ ] changeStage(ctx, id, newStage) → Deal
      - Record in deal_stage_history (from_stage, to_stage, changed_by)
      - Update deal.stage
      - Auto-update probability based on stage (configurable mapping)
      - Audit: deal.stage_change

- [ ] closeDeal(ctx, id, status, reason) → Deal + optional Project
      - Validate: win_loss_reason required
      - Set deal.status = won/lost, deal.closed_at = now()
      - If won:
          - Return data needed for guided project creation (Phase 4 integration)
          - Prepare initial payment schedule template
      - Audit: deal.close

- [ ] computeWeightedPipeline(ctx) → pipeline forecast
      - SUM(amount × probability / 100) grouped by stage
```

### Task 3.2.3 — Deal Health Indicators (Computed)
```
- [ ] days_in_stage: days since last stage change (from deal_stage_history)
- [ ] days_since_last_activity: days since deal.last_activity_at
- [ ] risk_flag: red if days_in_stage > threshold OR days_since_last_activity > threshold
      - Thresholds configurable in settings
```

### Task 3.2.4 — CRM Route Handlers
```
- [ ] GET/POST        /api/accounts              → list/create
- [ ] GET/PATCH/DELETE /api/accounts/:id          → get/update/delete
- [ ] GET/POST        /api/contacts              → list/create
- [ ] GET/POST        /api/interactions           → list/create
- [ ] GET/POST        /api/activities             → list/create
```

### Task 3.2.5 — Sales Route Handlers
```
- [ ] GET/POST        /api/deals                 → list(scoped)/create
- [ ] GET/PATCH/DELETE /api/deals/:id             → get/update/delete
- [ ] POST            /api/deals/:id/stage        → changeStage
- [ ] POST            /api/deals/:id/close        → closeDeal
- [ ] GET/POST        /api/quotes                → list/create
```

---

## 3.3 Frontend — CRM Module

### Task 3.3.1 — Account Pages
```
- [ ] app/(dashboard)/crm/accounts/page.tsx — Accounts list
      - Data table: Name, Industry, Status, Owner, # Contacts, Actions
      - Filters: status, industry, owner
      - Search by name
      - "Add Account" button

- [ ] app/(dashboard)/crm/accounts/new/page.tsx — Create account form
      - Name (required), industry, size, website, address, status, owner

- [ ] app/(dashboard)/crm/accounts/[id]/page.tsx — Account detail
      - Tabs: Overview | Contacts | Interactions | Deals | Activities
      - Overview: company info, tags, address
      - Contacts: list of contacts with primary badge
      - Interactions: timeline view (calls, emails, meetings, notes)
      - Deals: linked deals with stage badges
      - Activities: follow-up tasks
```

### Task 3.3.2 — Contact Pages
```
- [ ] app/(dashboard)/crm/contacts/page.tsx — Contacts list
      - Data table: Name, Account, Email, Phone, Title, Primary
      - Filter by account
      - "Add Contact" button → form modal
```

### Task 3.3.3 — Interaction & Activity Components
```
- [ ] components/crm/interaction-timeline.tsx — Chronological timeline
      - Different icons per type (phone, email, calendar, sticky note)
      - "Log Interaction" button → form modal

- [ ] components/crm/activity-list.tsx — Follow-up tasks
      - Filterable by status
      - Due date highlighting (overdue = red)
      - Quick status toggle
```

---

## 3.4 Frontend — Sales Module

### Task 3.4.1 — Pipeline Board View
```
- [ ] app/(dashboard)/sales/deals/page.tsx — Dual view:
      - Toggle: Pipeline (board) ↔ List (table) view
      - Board view:
          - Columns = stages (Lead → Qualified → Proposal → Negotiation → Won/Lost)
          - Cards = deals (name, account, amount, probability, days in stage)
          - Drag-and-drop between stages (triggers stage change API)
          - Stage totals at column header (count + weighted value)
      - List view:
          - Data table with all deal fields
          - Sort by amount, stage, probability, expected close
          - Filters: owner, stage, status, date range, amount range
```

### Task 3.4.2 — Deal Form & Detail
```
- [ ] app/(dashboard)/sales/deals/new/page.tsx — Create deal form
      - Name, account (searchable select), amount, currency, expected close date, source
      - Owner auto-set to current user
      - Stage defaults to 'lead'

- [ ] app/(dashboard)/sales/deals/[id]/page.tsx — Deal detail
      - Header: deal name, stage badge, amount, probability
      - Tabs: Overview | Stage History | Quotes | Activities
      - Stage history: visual timeline showing each stage change
      - Close deal button → modal with Won/Lost radio + reason field
      - Won → "Create Project" guided flow (links to Phase 4)
```

### Task 3.4.3 — Pipeline KPI Cards (for deal list header)
```
- [ ] Total pipeline value (weighted)
- [ ] Deals by stage (mini funnel)
- [ ] Win rate (won / (won + lost) last 30/90/365 days)
- [ ] Average deal size
```

### Task 3.4.4 — Quotes Page
```
- [ ] app/(dashboard)/sales/quotes/page.tsx — Quotes list
      - Linked to deals
      - Status badges
      - "Create Quote" → form with deal select, amount, valid until
```

---

## 3.5 Verification Checklist — Phase 3

```
- [ ] Accounts: CRUD working, all authenticated users can access
- [ ] Contacts: CRUD, linked to accounts, one primary per account
- [ ] Interactions: log calls/emails/meetings/notes against accounts/contacts
- [ ] Activities: create follow-up tasks with due dates and assignees
- [ ] Tags: create and assign tags to accounts/contacts
- [ ] Deals: any employee can create a deal (owner = creator)
- [ ] Deal pipeline: stage changes recorded in history with actor + timestamp
- [ ] Deal scoping: Employee sees own deals, Sales Lead/Admin sees all
- [ ] Deal health: days_in_stage and risk_flag computed correctly
- [ ] Close deal: won/lost requires reason
- [ ] Won deal: guided project creation flow available (stub for Phase 4)
- [ ] Weighted pipeline value computed correctly
- [ ] Pipeline board view: drag-and-drop stage changes
- [ ] Pipeline list view: sortable, filterable table
- [ ] Quotes: CRUD linked to deals
- [ ] All CRUD audited with before/after diffs
- [ ] RLS policies enforcing scoped access at DB level
- [ ] Zod validation on all new endpoints
- [ ] CI passing, deployed successfully
```

---

*Phase 3 completion = Milestone M3 (Sales Pipeline). Proceed to Phase 4 (Projects).*
