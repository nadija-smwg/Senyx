import { pgTable, uuid, varchar, text, numeric, date, timestamp, check, smallint, integer, boolean, unique, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { baseColumns } from './base';
import { accounts } from './crm';
import { deals } from './sales';
import { employees } from './hr';
import { sql } from 'drizzle-orm';

// ----------------------------------------------------------------------------
// PROJECTS
// ----------------------------------------------------------------------------
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g. PRJ-0007
  name: varchar('name', { length: 140 }).notNull(),
  type: varchar('type', { length: 10 }), // solution / product
  companyName: varchar('company_name', { length: 140 }),
  accountId: uuid('account_id').references(() => accounts.id),
  dealId: uuid('deal_id').references(() => deals.id),
  ownerId: uuid('owner_id').references(() => employees.id).notNull(),
  billingType: varchar('billing_type', { length: 15 }),
  status: varchar('status', { length: 12 }).default('planning').notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  budget: numeric('budget', { precision: 14, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull(),
}, (table) => [
  check('project_type_check', sql`${table.type} IN ('solution', 'product', 'internal')`),
  check('project_billing_check', sql`${table.billingType} IN ('fixed', 'time_materials', 'retainer')`),
  check('project_status_check', sql`${table.status} IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')`),
  check('project_dates_check', sql`${table.endDate} >= ${table.startDate}`),
  check('project_budget_check', sql`${table.budget} >= 0`),
  check('project_account_required_check', sql`${table.type} IN ('product', 'internal') OR ${table.accountId} IS NOT NULL`),
  
  index('project_account_idx').on(table.accountId),
  index('project_deal_idx').on(table.dealId),
  index('project_owner_idx').on(table.ownerId),
  index('project_status_idx').on(table.status),
]);

// ----------------------------------------------------------------------------
// PROJECT ASSIGNMENTS
// ----------------------------------------------------------------------------
export const projectAssignments = pgTable('project_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  roleOnProject: varchar('role_on_project', { length: 40 }),
  allocationPct: numeric('allocation_pct', { precision: 5, scale: 2 }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  unassignedAt: timestamp('unassigned_at', { withTimezone: true }),
}, (table) => [
  check('assignment_allocation_check', sql`${table.allocationPct} >= 0 AND ${table.allocationPct} <= 100`),
  uniqueIndex('unique_active_assignment').on(table.projectId, table.employeeId).where(sql`${table.unassignedAt} IS NULL`),
  index('assignment_project_idx').on(table.projectId),
  index('assignment_employee_idx').on(table.employeeId),
]);

// ----------------------------------------------------------------------------
// BOARD COLUMNS
// ----------------------------------------------------------------------------
export const boardColumns = pgTable('board_columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: varchar('name', { length: 40 }).notNull(),
  position: smallint('position').notNull(),
  wipLimit: smallint('wip_limit'),
}, (table) => [
  check('board_wip_check', sql`${table.wipLimit} >= 0`),
  unique('unique_column_position').on(table.projectId, table.position),
  index('column_project_pos_idx').on(table.projectId, table.position),
]);

// ----------------------------------------------------------------------------
// TASKS
// ----------------------------------------------------------------------------
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  columnId: uuid('column_id').references(() => boardColumns.id).notNull(),
  // Drizzle doesn't support recursive self-references cleanly without explicitly providing the name
  parentTaskId: uuid('parent_task_id'), 
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  assigneeId: uuid('assignee_id').references(() => employees.id),
  priority: varchar('priority', { length: 8 }).default('medium').notNull(),
  status: varchar('status', { length: 12 }).default('todo').notNull(),
  estimateHours: numeric('estimate_hours', { precision: 6, scale: 2 }),
  dueDate: date('due_date'),
  position: integer('position').default(0).notNull(),
}, (table) => [
  check('task_priority_check', sql`${table.priority} IN ('low', 'medium', 'high', 'urgent')`),
  check('task_status_check', sql`${table.status} IN ('todo', 'in_progress', 'review', 'done', 'blocked')`),
  check('task_estimate_check', sql`${table.estimateHours} >= 0`),
  
  index('task_board_idx').on(table.projectId, table.columnId, table.position),
  index('task_assignee_idx').on(table.assigneeId),
  index('task_duedate_idx').on(table.dueDate),
]);

// ----------------------------------------------------------------------------
// MILESTONES (Delivery)
// ----------------------------------------------------------------------------
export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  dueDate: date('due_date'),
  status: varchar('status', { length: 12 }).default('pending').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  check('milestone_status_check', sql`${table.status} IN ('pending', 'in_progress', 'completed')`),
  index('milestone_project_status_idx').on(table.projectId, table.status),
]);

// ----------------------------------------------------------------------------
// PAYMENT MILESTONES
// ----------------------------------------------------------------------------
export const paymentMilestones = pgTable('payment_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: varchar('name', { length: 80 }).notNull(),
  phase: varchar('phase', { length: 60 }),
  sequence: smallint('sequence').notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  amount: numeric('amount', { precision: 14, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull(),
  status: varchar('status', { length: 10 }).default('pending').notNull(),
  expectedDate: date('expected_date'),
  // invoiceId will be added when invoicing is built in Phase 5
  invoiceId: uuid('invoice_id'), 
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  check('payment_pct_check', sql`${table.percentage} >= 0 AND ${table.percentage} <= 100`),
  check('payment_amount_check', sql`${table.amount} >= 0`),
  check('payment_status_check', sql`${table.status} IN ('pending', 'due', 'invoiced', 'paid')`),
  unique('unique_payment_sequence').on(table.projectId, table.sequence),
  index('payment_project_status_idx').on(table.projectId, table.status),
]);

// ----------------------------------------------------------------------------
// TIME ENTRIES (Manual & Clock)
// ----------------------------------------------------------------------------
export const clockSessions = pgTable('clock_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  taskId: uuid('task_id').references(() => tasks.id),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  clockInAt: timestamp('clock_in_at', { withTimezone: true }).defaultNow().notNull(),
  clockOutAt: timestamp('clock_out_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => [
  check('clock_out_check', sql`${table.clockOutAt} > ${table.clockInAt}`),
  check('clock_duration_check', sql`${table.durationSeconds} >= 0`),
  // Ensure only one active clock session per employee at any time
  uniqueIndex('unique_active_clock').on(table.employeeId).where(sql`${table.isActive} = true`),
]);

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  taskId: uuid('task_id').references(() => tasks.id),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  workDate: date('work_date').notNull(),
  hours: numeric('hours', { precision: 6, scale: 2 }).notNull(),
  description: text('description'),
  billable: boolean('billable').default(true).notNull(),
  source: varchar('source', { length: 6 }).default('manual').notNull(),
  clockSessionId: uuid('clock_session_id').references(() => clockSessions.id),
}, (table) => [
  check('time_hours_check', sql`${table.hours} > 0 AND ${table.hours} <= 24`),
  check('time_source_check', sql`${table.source} IN ('manual', 'clock')`),
  index('time_project_employee_idx').on(table.projectId, table.employeeId),
  index('time_workdate_idx').on(table.workDate),
]);

// ----------------------------------------------------------------------------
// PROJECT RISKS
// ----------------------------------------------------------------------------
export const projectRisks = pgTable('project_risks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  title: varchar('title', { length: 160 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 8 }),
  status: varchar('status', { length: 10 }).default('open').notNull(),
  ownerId: uuid('owner_id').references(() => employees.id),
}, (table) => [
  check('risk_severity_check', sql`${table.severity} IN ('low', 'medium', 'high', 'critical')`),
  check('risk_status_check', sql`${table.status} IN ('open', 'mitigating', 'closed')`),
  index('risk_project_idx').on(table.projectId),
]);
