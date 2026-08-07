import { 
  pgTable, uuid, varchar, text, timestamp, boolean, 
  index, check, foreignKey, unique, date, numeric, char 
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { baseColumns } from './base';
import { accounts } from './crm';
import { projects, paymentMilestones } from './projects';
import { deals } from './sales';
import { employees } from './hr';

// ----------------------------------------------------------------------------
// INVOICES
// ----------------------------------------------------------------------------
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  invoiceNumber: varchar('invoice_number', { length: 20 }).notNull().unique(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  dealId: uuid('deal_id').references(() => deals.id),
  paymentMilestoneId: uuid('payment_milestone_id').references(() => paymentMilestones.id),
  
  issueDate: date('issue_date'),
  dueDate: date('due_date'),
  
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 14, scale: 2 }).default('0').notNull(),
  total: numeric('total', { precision: 14, scale: 2 }).notNull(),
  currency: char('currency', { length: 3 }).notNull(),
  
  status: varchar('status', { length: 12 }).default('draft').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
}, (table) => [
  check('invoice_due_date_check', sql`${table.dueDate} >= ${table.issueDate} OR ${table.issueDate} IS NULL`),
  check('invoice_subtotal_check', sql`${table.subtotal} >= 0`),
  check('invoice_tax_check', sql`${table.tax} >= 0`),
  check('invoice_total_check', sql`${table.total} >= 0`),
  check('invoice_status_check', sql`${table.status} IN ('draft', 'sent', 'paid', 'overdue', 'void')`),
  
  index('invoice_account_idx').on(table.accountId),
  index('invoice_project_idx').on(table.projectId),
  index('invoice_deal_idx').on(table.dealId),
  index('invoice_payment_milestone_idx').on(table.paymentMilestoneId),
  index('invoice_status_due_idx').on(table.status, table.dueDate),
  index('invoice_active_idx').on(table.status).where(sql`${table.deletedAt} IS NULL`),
]);

// ----------------------------------------------------------------------------
// INVOICE LINE ITEMS
// ----------------------------------------------------------------------------
export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  description: varchar('description', { length: 200 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('line_item_qty_check', sql`${table.quantity} > 0`),
  check('line_item_price_check', sql`${table.unitPrice} >= 0`),
  check('line_item_amount_check', sql`${table.amount} >= 0`),
  index('line_item_invoice_idx').on(table.invoiceId),
]);

// ----------------------------------------------------------------------------
// EXPENSES
// ----------------------------------------------------------------------------
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  vendor: varchar('vendor', { length: 120 }).notNull(),
  category: varchar('category', { length: 60 }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: char('currency', { length: 3 }).notNull(),
  expenseDate: date('expense_date').notNull(),
  
  projectId: uuid('project_id').references(() => projects.id),
  approvalStatus: varchar('approval_status', { length: 12 }).default('pending').notNull(),
  approverId: uuid('approver_id').references(() => employees.id),
  
  // Note: receiptDocumentId is conceptually a FK to a documents table that might be created later.
  // We'll leave it as uuid for now since Phase 8 handles document storage explicitly.
  receiptDocumentId: uuid('receipt_document_id'),
}, (table) => [
  check('expense_amount_check', sql`${table.amount} >= 0`),
  check('expense_approval_check', sql`${table.approvalStatus} IN ('pending', 'approved', 'rejected', 'reimbursed')`),
  index('expense_project_idx').on(table.projectId),
  index('expense_approval_idx').on(table.approvalStatus),
]);

// ----------------------------------------------------------------------------
// PAYMENTS
// ----------------------------------------------------------------------------
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  expenseId: uuid('expense_id').references(() => expenses.id),
  
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: char('currency', { length: 3 }).notNull(),
  method: varchar('method', { length: 15 }).notNull(),
  
  paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
  reference: varchar('reference', { length: 80 }),
  exchangeRate: numeric('exchange_rate', { precision: 14, scale: 6 }),
}, (table) => [
  check('payment_link_check', sql`${table.invoiceId} IS NOT NULL OR ${table.expenseId} IS NOT NULL`),
  check('payment_amount_check', sql`${table.amount} > 0`),
  check('payment_method_check', sql`${table.method} IN ('bank_transfer', 'card', 'cash', 'cheque', 'online')`),
  index('payment_invoice_idx').on(table.invoiceId),
  index('payment_expense_idx').on(table.expenseId),
]);

// ----------------------------------------------------------------------------
// SUBSCRIPTIONS
// ----------------------------------------------------------------------------
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  productName: varchar('product_name', { length: 80 }).notNull(),
  plan: varchar('plan', { length: 60 }),
  
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: char('currency', { length: 3 }).notNull(),
  interval: varchar('interval', { length: 10 }).notNull(),
  
  status: varchar('status', { length: 12 }).default('active').notNull(),
  startedAt: date('started_at').notNull(),
  currentPeriodEnd: date('current_period_end'),
  mrr: numeric('mrr', { precision: 14, scale: 2 }),
}, (table) => [
  check('subscription_amount_check', sql`${table.amount} >= 0`),
  check('subscription_interval_check', sql`${table.interval} IN ('monthly', 'quarterly', 'annual')`),
  check('subscription_status_check', sql`${table.status} IN ('trialing', 'active', 'past_due', 'cancelled')`),
  index('subscription_account_idx').on(table.accountId),
  index('subscription_status_idx').on(table.status),
]);
