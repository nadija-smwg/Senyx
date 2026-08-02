# API Routes & Functions Reference — SENYX ERP System

## Complete API Catalogue

All routes are under `/app/api/`. Every route follows the pipeline:  
**Authenticate → Authorize (RBAC) → Validate (Zod) → Execute (Transaction + Audit) → Respond**

---

## 1. Authentication & Session Management

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | Authenticate user, create session (device/IP/browser), return JWT | Public | ✅ `auth.login` |
| 2 | POST | `/api/auth/logout` | End session, compute duration | Authenticated | ✅ `auth.logout` |
| 3 | POST | `/api/auth/2fa/verify` | Verify 2FA TOTP code | Authenticated | ✅ `auth.2fa_verify` |
| 4 | POST | `/api/auth/password/reset-request` | Send password reset email (time-limited token) | Public | ✅ `auth.reset_request` |
| 5 | POST | `/api/auth/password/reset` | Complete password reset with token | Public | ✅ `auth.reset` |
| 6 | GET | `/api/auth/me` | Return current user, roles, permissions, employee data | Authenticated | ❌ |
| 7 | GET | `/api/sessions` | List active/historical sessions | Admin | ✅ `session.list` |
| 8 | DELETE | `/api/sessions/:id` | Force-terminate a session | Admin | ✅ `session.terminate` |

---

## 2. RBAC & Settings

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 9 | GET | `/api/roles` | List all roles | Admin | ❌ |
| 10 | POST | `/api/roles` | Create new role | Admin | ✅ `role.create` |
| 11 | GET | `/api/roles/:id` | Get role with permissions | Admin | ❌ |
| 12 | PATCH | `/api/roles/:id` | Update role + permissions | Admin | ✅ `role.update` |
| 13 | DELETE | `/api/roles/:id` | Delete role (non-system only) | Admin | ✅ `role.delete` |
| 14 | GET | `/api/permissions` | List all permission entries | Admin | ❌ |
| 15 | GET | `/api/settings` | Read config key-values | Admin | ❌ |
| 16 | PATCH | `/api/settings` | Update config key-values | Admin | ✅ `settings.update` |

---

## 3. HR & People Management

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 17 | GET | `/api/employees` | List employees (paginated, filterable) | HR/Admin | ❌ |
| 18 | POST | `/api/employees` | Create employee (single source of truth) | HR/Admin | ✅ `employee.create` |
| 19 | GET | `/api/employees/:id` | Get employee detail (sensitive fields HR-only) | Authenticated (own) / HR | ✅ (sensitive access) |
| 20 | PATCH | `/api/employees/:id` | Update employee record | HR/Admin | ✅ `employee.update` |
| 21 | DELETE | `/api/employees/:id` | Soft-delete (deactivate) employee | HR/Admin | ✅ `employee.deactivate` |
| 22 | POST | `/api/employees/:id/skills` | Attach skill + proficiency to employee | HR/Admin | ✅ `employee.skill_add` |
| 23 | GET | `/api/designations` | List designations | Authenticated | ❌ |
| 24 | POST | `/api/designations` | Create designation (job title) | Admin | ✅ `designation.create` |
| 25 | GET | `/api/departments` | List departments | Authenticated | ❌ |
| 26 | POST | `/api/departments` | Create department | Admin | ✅ `department.create` |
| 27 | GET | `/api/skills` | List skills catalogue | Authenticated | ❌ |
| 28 | POST | `/api/skills` | Create skill entry | Admin | ✅ `skill.create` |
| 29 | GET | `/api/leave-types` | List leave types | Authenticated | ❌ |
| 30 | POST | `/api/leave-types` | Create leave type | HR/Admin | ✅ `leave_type.create` |
| 31 | GET | `/api/leave-requests` | List leave requests (scoped) | Authenticated | ❌ |
| 32 | POST | `/api/leave-requests` | Submit leave request | Authenticated (own) | ✅ `leave.request` |
| 33 | POST | `/api/leave-requests/:id/decision` | Approve/reject leave request | HR/Manager | ✅ `leave.decision` |
| 34 | GET | `/api/leave-balances` | Get leave balances (scoped) | Authenticated | ❌ |
| 35 | GET | `/api/payroll` | List payroll records | HR/Admin | ✅ (access audit) |
| 36 | POST | `/api/payroll` | Generate payroll record | HR/Admin | ✅ `payroll.create` |
| 37 | GET | `/api/performance-reviews` | List reviews | HR/Admin/Own | ❌ |
| 38 | POST | `/api/performance-reviews` | Create performance review | HR/Manager | ✅ `review.create` |

---

## 4. CRM

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 39 | GET | `/api/accounts` | List client accounts (paginated, filterable) | Authenticated | ❌ |
| 40 | POST | `/api/accounts` | Create client account | Authenticated | ✅ `account.create` |
| 41 | GET | `/api/accounts/:id` | Get account detail with contacts | Authenticated | ❌ |
| 42 | PATCH | `/api/accounts/:id` | Update account | Authenticated | ✅ `account.update` |
| 43 | DELETE | `/api/accounts/:id` | Soft-delete account | Admin | ✅ `account.delete` |
| 44 | GET | `/api/contacts` | List contacts (filterable by account) | Authenticated | ❌ |
| 45 | POST | `/api/contacts` | Create contact (linked to account) | Authenticated | ✅ `contact.create` |
| 46 | GET | `/api/interactions` | List interaction history | Authenticated | ❌ |
| 47 | POST | `/api/interactions` | Log interaction (call/email/meeting/note) | Authenticated | ✅ `interaction.create` |
| 48 | GET | `/api/activities` | List follow-up tasks | Authenticated | ❌ |
| 49 | POST | `/api/activities` | Create activity/task | Authenticated | ✅ `activity.create` |

---

## 5. Sales

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 50 | GET | `/api/deals` | List deals (scoped: own for Employee, all for Sales Lead) | Authenticated | ❌ |
| 51 | POST | `/api/deals` | Create deal (any employee, owner = creator) | Authenticated | ✅ `deal.create` |
| 52 | GET | `/api/deals/:id` | Get deal detail with stage history | Scoped | ❌ |
| 53 | PATCH | `/api/deals/:id` | Update deal fields | Scoped | ✅ `deal.update` |
| 54 | DELETE | `/api/deals/:id` | Soft-delete deal | Owner/Admin | ✅ `deal.delete` |
| 55 | POST | `/api/deals/:id/stage` | Change deal stage (writes stage history) | Scoped | ✅ `deal.stage_change` |
| 56 | POST | `/api/deals/:id/close` | Close deal as Won/Lost (+reason, guided project creation) | Scoped | ✅ `deal.close` |
| 57 | GET | `/api/quotes` | List quotes | Authenticated | ❌ |
| 58 | POST | `/api/quotes` | Create quote (linked to deal, with document) | Authenticated | ✅ `quote.create` |

---

## 6. Projects

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 59 | GET | `/api/projects` | List projects (scoped: own/assigned/all) | Authenticated | ❌ |
| 60 | POST | `/api/projects` | Create project (Solution/Product type) | Project Owner / Admin | ✅ `project.create` |
| 61 | GET | `/api/projects/:id` | Get project detail | Scoped | ❌ |
| 62 | PATCH | `/api/projects/:id` | Update project | Owner/Admin | ✅ `project.update` |
| 63 | DELETE | `/api/projects/:id` | Soft-delete project | Admin | ✅ `project.delete` |
| 64 | GET | `/api/projects/:id/board` | Get Kanban board (columns + tasks) | Assigned/Owner | ❌ |
| 65 | POST | `/api/projects/:id/columns` | Add/reorder board columns | Owner/Admin | ✅ `column.create` |
| 66 | GET | `/api/projects/:id/tasks` | List tasks (filterable) | Assigned/Owner | ❌ |
| 67 | POST | `/api/projects/:id/tasks` | Create task on board | Assigned/Owner | ✅ `task.create` |
| 68 | PATCH | `/api/tasks/:id` | Update task fields | Assigned/Owner | ✅ `task.update` |
| 69 | POST | `/api/tasks/:id/move` | Move task card (column + position, optimistic) | Assigned/Owner | ✅ `task.move` |
| 70 | GET | `/api/projects/:id/assignments` | List team assignments | Scoped | ❌ |
| 71 | POST | `/api/projects/:id/assignments` | Assign employee to project | Owner/Admin | ✅ `assignment.create` |
| 72 | GET | `/api/projects/:id/milestones` | List delivery milestones | Scoped | ❌ |
| 73 | POST | `/api/projects/:id/milestones` | Create delivery milestone | Owner | ✅ `milestone.create` |
| 74 | POST | `/api/milestones/:id/complete` | Complete milestone (→ triggers payment due + draft invoice) | Owner | ✅ `milestone.complete` |
| 75 | GET | `/api/projects/:id/payment-milestones` | List payment schedule (% breakdown) | Owner/Finance | ❌ |
| 76 | POST | `/api/projects/:id/payment-milestones` | Create payment milestone (sum must = 100%) | Owner | ✅ `payment_milestone.create` |
| 77 | GET | `/api/projects/:id/time-entries` | List time entries | Scoped | ❌ |
| 78 | POST | `/api/projects/:id/time-entries` | Log manual time entry | Assigned | ✅ `time.log` |
| 79 | POST | `/api/projects/:id/clock/in` | Clock in (one active per employee) | Assigned | ✅ `clock.in` |
| 80 | POST | `/api/clock/out` | Clock out (compute duration, optional time entry) | Authenticated | ✅ `clock.out` |
| 81 | GET | `/api/projects/:id/risks` | List risks/issues | Owner/Assigned | ❌ |
| 82 | POST | `/api/projects/:id/risks` | Create risk/issue entry | Owner | ✅ `risk.create` |
| 83 | GET | `/api/projects/:id/summary` | Project Owner dashboard data | Owner | ❌ |

---

## 7. Finance

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 84 | GET | `/api/invoices` | List invoices (filterable by status/date/client) | Finance/Admin | ❌ |
| 85 | POST | `/api/invoices` | Create invoice (from deal/milestone/manual) | Finance | ✅ `invoice.create` |
| 86 | GET | `/api/invoices/:id` | Get invoice detail with line items | Finance/Admin | ❌ |
| 87 | PATCH | `/api/invoices/:id` | Update draft invoice | Finance | ✅ `invoice.update` |
| 88 | POST | `/api/invoices/:id/issue` | Issue draft invoice (status → sent) | Finance (approve) | ✅ `invoice.issue` |
| 89 | GET | `/api/expenses` | List expenses | Finance/Admin | ❌ |
| 90 | POST | `/api/expenses` | Create expense | Authenticated | ✅ `expense.create` |
| 91 | POST | `/api/expenses/:id/approve` | Approve/reject expense | Finance (approve) | ✅ `expense.approve` |
| 92 | GET | `/api/payments` | List payments | Finance/Admin | ❌ |
| 93 | POST | `/api/payments` | Record payment (linked to invoice or expense) | Finance | ✅ `payment.create` |
| 94 | GET | `/api/subscriptions` | List subscriptions (recurring revenue) | Finance/Admin | ❌ |
| 95 | POST | `/api/subscriptions` | Create subscription | Finance | ✅ `subscription.create` |

---

## 8. Platform Services

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 96 | POST | `/api/documents` | Upload document to R2 (returns key + signed URL) | Authenticated | ✅ `document.upload` |
| 97 | GET | `/api/documents/:id` | Get signed download URL | Scoped (inherits owner) | ❌ |
| 98 | DELETE | `/api/documents/:id` | Delete document from R2 | Owner/Admin | ✅ `document.delete` |
| 99 | GET | `/api/notifications` | List user notifications (in-app) | Authenticated (own) | ❌ |
| 100 | POST | `/api/notifications/:id/read` | Mark notification as read | Authenticated (own) | ❌ |

---

## 9. Analytics, Reports & Audit

| # | Method | Route | Function | Auth | Audit |
|---|---|---|---|---|---|
| 101 | GET | `/api/analytics/dashboard` | Role-aware KPI dashboard data | Authenticated | ❌ |
| 102 | POST | `/api/analytics/query` | Structured multi-criteria query (AND/OR filters) | Authenticated | ✅ `analytics.query` |
| 103 | GET | `/api/reports/:type` | Generate standard report (PDF/CSV export) | Authenticated | ✅ `report.export` |
| 104 | GET | `/api/audit-logs` | List/filter audit log entries | Admin/Auditor | ✅ `audit.view` |
| 105 | GET | `/api/audit-logs/analytics` | Activity analytics (per user/route/device/time) | Admin/Auditor | ✅ `audit.analytics` |

---

## 10. Function Summary by Module

| Module | Functions (Service Methods) | Tables Affected |
|---|---|---|
| **Auth** | login, logout, verify2FA, resetRequest, resetPassword, getMe | users, sessions, audit_logs |
| **RBAC** | listRoles, createRole, updateRole, deleteRole, listPermissions, getSettings, updateSettings | roles, permissions, role_permissions, user_roles, settings |
| **HR** | createEmployee, updateEmployee, deactivateEmployee, addSkill, listDesignations, listDepartments | employees, designations, departments, skills, employee_skills |
| **Leave** | requestLeave, decideLeave, getBalances | leave_requests, leave_balances, leave_types |
| **Payroll** | generatePayroll, listPayroll | payroll_records |
| **Reviews** | createReview, listReviews | performance_reviews |
| **CRM** | createAccount, updateAccount, createContact, logInteraction, createActivity | accounts, contacts, interactions, activities, tags, taggables |
| **Sales** | createDeal, updateDeal, changeStage, closeDeal, createQuote | deals, deal_stage_history, quotes |
| **Projects** | createProject, updateProject, getBoard, createColumn, assignEmployee | projects, project_assignments, board_columns |
| **Tasks** | createTask, updateTask, moveTask | tasks |
| **Time** | logTimeEntry, clockIn, clockOut | time_entries, clock_sessions |
| **Milestones** | createMilestone, completeMilestone, createPaymentMilestone | milestones, payment_milestones |
| **Finance** | createInvoice, issueInvoice, createExpense, approveExpense, recordPayment, createSubscription | invoices, invoice_line_items, expenses, payments, subscriptions |
| **Documents** | uploadDocument, getDownloadUrl, deleteDocument | documents |
| **Notifications** | listNotifications, markRead, sendReminder | notifications |
| **Analytics** | getDashboard, executeQuery, generateReport | (reads across all) |
| **Audit** | listAuditLogs, getAuditAnalytics | audit_logs, sessions |

---

## Total Count

| Category | Count |
|---|---|
| **API Routes** | 105 |
| **Database Tables** | 37 |
| **Service Modules** | 18 |
| **Enumerations** | 28 |
| **TypeScript Interfaces** | 25+ |

---

*This document serves as the complete function and API reference. See the individual blueprints for architecture details.*
