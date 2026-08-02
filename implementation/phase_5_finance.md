# Phase 5 — Finance

**Duration:** 2–3 weeks  
**Dependencies:** Phase 3 (Sales/Deals), Phase 4 (Projects/Milestones)  
**Tables:** 5 — `invoices`, `invoice_line_items`, `expenses`, `payments`, `subscriptions`  
**API Routes:** 12  

---

## 5.1 Database Schema — Finance

### Task 5.1.1 — Create Drizzle Schema: Finance

**File: `src/server/db/schema/finance.ts`**

```
- [ ] Define `invoices` table:
      invoice_number (varchar(20), NOT NULL, UNIQUE) — e.g. INV-2026-0042
      account_id (uuid, NOT NULL, FK → accounts)
      project_id (uuid, nullable, FK → projects)
      deal_id (uuid, nullable, FK → deals)
      payment_milestone_id (uuid, nullable, FK → payment_milestones)
      issue_date (date, nullable) — null while draft
      due_date (date, nullable) — CHECK >= issue_date
      subtotal (numeric(14,2), NOT NULL, CHECK >= 0)
      tax (numeric(14,2), default 0, CHECK >= 0)
      total (numeric(14,2), NOT NULL, CHECK >= 0) — subtotal + tax
      currency (char(3), NOT NULL)
      status (varchar(8), CHECK: draft/sent/paid/overdue/void, default 'draft')
      paid_at (timestamptz, nullable)
      + base columns

- [ ] Define `invoice_line_items` table:
      id (uuid PK)
      invoice_id (uuid, FK → invoices, ON DELETE CASCADE)
      description (varchar(200), NOT NULL)
      quantity (numeric(10,2), NOT NULL, CHECK > 0)
      unit_price (numeric(14,2), NOT NULL, CHECK >= 0)
      amount (numeric(14,2), NOT NULL, CHECK >= 0) — quantity × unit_price
      created_at (timestamptz, default now())

- [ ] Define `expenses` table:
      vendor (varchar(120), NOT NULL)
      category (varchar(60), NOT NULL)
      amount (numeric(14,2), NOT NULL, CHECK >= 0)
      currency (char(3), NOT NULL)
      expense_date (date, NOT NULL)
      project_id (uuid, nullable, FK → projects) — cost attribution
      approval_status (varchar(10), CHECK: pending/approved/rejected/reimbursed, default 'pending')
      approver_id (uuid, nullable, FK → employees)
      receipt_document_id (uuid, nullable, FK → documents)
      + base columns

- [ ] Define `payments` table:
      invoice_id (uuid, nullable, FK → invoices)
      expense_id (uuid, nullable, FK → expenses)
      amount (numeric(14,2), NOT NULL, CHECK > 0)
      currency (char(3), NOT NULL)
      method (varchar(15), CHECK: bank_transfer/card/cash/cheque/online)
      paid_at (timestamptz, default now())
      reference (varchar(80), nullable) — transaction ref
      exchange_rate (numeric(14,6), nullable) — if multi-currency
      CHECK: invoice_id IS NOT NULL OR expense_id IS NOT NULL
      + base columns

- [ ] Define `subscriptions` table (AI product recurring revenue):
      account_id (uuid, FK → accounts)
      product_name (varchar(80), NOT NULL)
      plan (varchar(60), nullable)
      amount (numeric(14,2), NOT NULL, CHECK >= 0)
      currency (char(3), NOT NULL)
      interval (varchar(10), CHECK: monthly/quarterly/annual)
      status (varchar(10), CHECK: trialing/active/past_due/cancelled, default 'active')
      started_at (date, NOT NULL)
      current_period_end (date, nullable)
      mrr (numeric(14,2), nullable) — normalized monthly value
      + base columns
```

### Task 5.1.2 — Generate & Run Migration
```
- [ ] npx drizzle-kit generate
- [ ] npx drizzle-kit push
```

### Task 5.1.3 — Indexes
```
- [ ] invoices(account_id), invoices(project_id), invoices(deal_id)
- [ ] invoices(payment_milestone_id)
- [ ] invoices(status, due_date) — for overdue queries
- [ ] invoices(status) WHERE deleted_at IS NULL
- [ ] invoice_line_items(invoice_id)
- [ ] expenses(project_id), expenses(approval_status)
- [ ] payments(invoice_id), payments(expense_id)
- [ ] subscriptions(account_id), subscriptions(status)
```

### Task 5.1.4 — RLS Policies
```
- [ ] invoices: Finance/Admin → full; Project Owner → view own project invoices
- [ ] expenses: Authenticated → create; Finance → approve; Admin → full
- [ ] payments: Finance/Admin only
- [ ] subscriptions: Finance/Admin only
```

### Task 5.1.5 — Invoice Number Generator
```
- [ ] generateInvoiceNumber() → "INV-2026-0001", "INV-2026-0002", ...
      - Year-based reset
      - Sequential within year
      - Pad with zeros
```

---

## 5.2 Backend — Finance Services

### Task 5.2.1 — Finance Service
**File: `src/server/services/finance.service.ts`**
```
- [ ] listInvoices(ctx, params) → paginated invoices
      - Filters: status, account, project, date range
      - Include: line items, payment total, outstanding amount
      - Finance/Admin → all; Project Owner → own project invoices

- [ ] createInvoice(ctx, input) → Invoice
      - Validate line items, compute subtotal/tax/total
      - Status = 'draft'
      - Generate invoice_number
      - Audit: invoice.create

- [ ] createFromMilestone(ctx, paymentMilestoneId) → Invoice
      - Fetch payment_milestone, project, account
      - Create invoice with single line item (milestone amount)
      - Link payment_milestone_id
      - Update payment_milestone.invoice_id and status = 'invoiced'
      - Audit: invoice.create_from_milestone

- [ ] updateInvoice(ctx, id, input) → Invoice
      - Only drafts can be updated
      - Audit: invoice.update

- [ ] issueInvoice(ctx, id) → Invoice
      - Status: draft → sent
      - Set issue_date = today (if not already set)
      - Validate due_date set
      - Permission-gated (Finance approve action)
      - Audit: invoice.issue

- [ ] getAccountsReceivable(ctx) → aging report
      - Outstanding invoices grouped by age (current, 30, 60, 90+)
      - Include milestone collection status

- [ ] getAccountsPayable(ctx) → pending expenses
```

### Task 5.2.2 — Expense Service
```
- [ ] listExpenses(ctx, params) → paginated expenses
- [ ] createExpense(ctx, input) → Expense
      - Optional: project_id for cost attribution
      - Optional: receipt_document_id (Phase 8)
      - Audit: expense.create

- [ ] approveExpense(ctx, id, decision) → Expense
      - decision: approved/rejected
      - Set approver_id, update status
      - Permission-gated (Finance approve)
      - Audit: expense.approve
```

### Task 5.2.3 — Payment Service
```
- [ ] listPayments(ctx, params) → payments
- [ ] recordPayment(ctx, input) → Payment
      - Link to invoice or expense
      - If linked to invoice:
        - Update invoice.status = 'paid' (if fully paid)
        - Set invoice.paid_at
        - Update linked payment_milestone.status = 'paid' (if applicable)
      - Support partial payments
      - Handle exchange_rate for multi-currency
      - Audit: payment.create
```

### Task 5.2.4 — Subscription Service
```
- [ ] listSubscriptions(ctx, params) → subscriptions
- [ ] createSubscription(ctx, input) → Subscription
      - Compute MRR based on amount + interval:
        monthly: MRR = amount
        quarterly: MRR = amount / 3
        annual: MRR = amount / 12
      - Audit: subscription.create
- [ ] updateSubscription(ctx, id, input) → Subscription (audited)
```

### Task 5.2.5 — Milestone → Invoice Flow (Integration with Phase 4)
```
Complete flow:
1. Phase/milestone completed (Phase 4: POST /milestones/:id/complete)
2. Matching payment_milestone.status → 'due'
3. System calls financeService.createFromMilestone()
4. Draft invoice created with line item
5. Finance reviews and issues: POST /invoices/:id/issue → status 'sent'
6. Payment recorded: POST /payments → invoice 'paid', milestone 'paid'

- [ ] Wire Phase 4 milestone.complete to call finance service
- [ ] Configurable via settings: invoice.auto_issue (default false = draft)
```

### Task 5.2.6 — Overdue Invoice Check (Scheduled)
**File: `src/scheduled/overdue-invoice-check.ts`**
```
- [ ] Cron job (daily at midnight):
      - Find invoices with status='sent' AND due_date < today
      - Update status to 'overdue'
      - Create notifications for Finance users
      - Audit: invoice.overdue (system action)
```

### Task 5.2.7 — Route Handlers (12 routes)
```
- [ ] GET/POST       /api/invoices              → list/create
- [ ] GET/PATCH      /api/invoices/:id          → get/update
- [ ] POST           /api/invoices/:id/issue    → issue (Finance approve)
- [ ] GET/POST       /api/expenses              → list/create
- [ ] POST           /api/expenses/:id/approve  → approve/reject
- [ ] GET/POST       /api/payments              → list/record
- [ ] GET/POST       /api/subscriptions         → list/create
```

---

## 5.3 Frontend — Finance Module

### Task 5.3.1 — Invoice Pages
```
- [ ] app/(dashboard)/finance/invoices/page.tsx — Invoice list
      - Data table: Invoice #, Client, Project, Amount, Status, Due Date, Actions
      - Filters: status, client, date range, amount range
      - Status badges: draft (gray), sent (blue), paid (green), overdue (red), void (dark)
      - Totals row: total outstanding, total overdue

- [ ] app/(dashboard)/finance/invoices/[id]/page.tsx — Invoice detail
      - Invoice header: number, client, dates, status
      - Line items table (description, qty, unit price, amount)
      - Subtotal, tax, total
      - Payment history (linked payments)
      - Actions: Edit (draft only), Issue, Record Payment, Void
      - PDF export button

- [ ] Invoice form (create/edit):
      - Client (searchable select)
      - Project (optional, filters by client)
      - Due date
      - Line items (dynamic add/remove rows)
      - Auto-compute: line amount, subtotal, tax (from settings), total
      - Currency selector
```

### Task 5.3.2 — Expense Pages
```
- [ ] app/(dashboard)/finance/expenses/page.tsx — Expense list
      - Data table: Vendor, Category, Amount, Date, Status, Project, Actions
      - Filters: status, category, project, date range
      - Approval actions inline (approve/reject buttons for Finance)
      - "Add Expense" button

- [ ] Expense form:
      - Vendor, category, amount, currency, date
      - Project (optional — for cost attribution)
      - Receipt upload (Phase 8 integration)
```

### Task 5.3.3 — Payment Pages
```
- [ ] app/(dashboard)/finance/payments/page.tsx — Payments list
      - Data table: Date, Invoice/Expense, Amount, Method, Reference
      - "Record Payment" → form modal
      - Payment form: invoice/expense select, amount, method, reference, date
```

### Task 5.3.4 — Subscription Pages
```
- [ ] app/(dashboard)/finance/subscriptions/page.tsx — Subscriptions list
      - Data table: Product, Client, Amount, Interval, Status, MRR
      - Total MRR/ARR summary card at top
      - "Add Subscription" → form
```

### Task 5.3.5 — Financial KPI Cards (for Finance dashboard area)
```
- [ ] Total Revenue (invoices paid, period)
- [ ] Total Expenses (approved, period)
- [ ] Outstanding Receivables (sent + overdue invoices)
- [ ] Overdue Invoices (count + total)
- [ ] MRR / ARR (from subscriptions)
- [ ] Net Profit (revenue - expenses, period)
```

### Task 5.3.6 — Accounts Receivable View
```
- [ ] Aging table: Current, 1-30 days, 31-60 days, 61-90 days, 90+ days
- [ ] Include milestone collection breakdown per project
```

---

## 5.4 Verification Checklist — Phase 5

```
- [ ] Invoices: create draft, add line items, issue, mark paid
- [ ] Invoice number auto-generated (INV-2026-0001)
- [ ] Invoice from milestone: draft created when milestone completed
- [ ] Issue invoice: Finance permission required (approve action)
- [ ] Expenses: create, approve/reject by Finance
- [ ] Payments: record linked to invoice or expense
- [ ] Payment → invoice paid status update working
- [ ] Payment → payment_milestone paid status update working
- [ ] Full flow: milestone complete → draft invoice → issue → payment → paid
- [ ] Multi-currency support with exchange rate recording
- [ ] Subscriptions: CRUD with MRR/ARR computation
- [ ] Overdue invoice cron: marks sent invoices as overdue past due date
- [ ] Accounts receivable aging view working
- [ ] Invoice PDF export (basic)
- [ ] All operations audited
- [ ] Finance approval actions permission-gated
- [ ] RLS policies enforcing Finance/Admin access
- [ ] CI passing, deployed
```

---

*Phase 5 completion = Milestone M5 (Financial Ops). Proceed to Phase 6 (Notifications).*
