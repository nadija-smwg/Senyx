import { pgTable, uuid, varchar, text, numeric, timestamp, check, index, date } from 'drizzle-orm/pg-core';
import { baseColumns } from './base';
import { employees } from './hr';
import { users } from './identity';
import { accounts } from './crm';
import { sql } from 'drizzle-orm';

// ----------------------------------------------------------------------------
// DEALS (Sales Opportunities)
// ----------------------------------------------------------------------------
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  name: varchar('name', { length: 140 }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  ownerId: uuid('owner_id').references(() => employees.id).notNull(), // whose sale it is
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  stage: varchar('stage', { length: 14 }).default('lead').notNull(),
  probability: numeric('probability', { precision: 5, scale: 2 }).default('0'), // 0-100
  expectedCloseDate: date('expected_close_date'),
  source: varchar('source', { length: 40 }),
  status: varchar('status', { length: 6 }).default('open').notNull(), // open/won/lost
  winLossReason: text('win_loss_reason'),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (table) => [
  check('deal_amount_check', sql`${table.amount} >= 0`),
  check('deal_probability_check', sql`${table.probability} >= 0 AND ${table.probability} <= 100`),
  check('deal_stage_check', sql`${table.stage} IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')`),
  check('deal_status_check', sql`${table.status} IN ('open', 'won', 'lost')`),
  index('deal_account_idx').on(table.accountId),
  index('deal_owner_idx').on(table.ownerId),
  index('deal_stage_idx').on(table.stage),
  index('deal_status_idx').on(table.status),
  // Composite for scoped pipeline
  index('deal_owner_stage_idx').on(table.ownerId, table.stage),
  index('deal_status_close_idx').on(table.status, table.expectedCloseDate),
]);

// ----------------------------------------------------------------------------
// DEAL STAGE HISTORY (Append-only audit log for time-in-stage)
// ----------------------------------------------------------------------------
export const dealStageHistory = pgTable('deal_stage_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  fromStage: varchar('from_stage', { length: 14 }), // null for initial creation
  toStage: varchar('to_stage', { length: 14 }).notNull(),
  changedById: uuid('changed_by').references(() => users.id).notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('deal_history_deal_idx').on(table.dealId, table.changedAt),
]);

// ----------------------------------------------------------------------------
// QUOTES
// ----------------------------------------------------------------------------
export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  dealId: uuid('deal_id').references(() => deals.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  validUntil: date('valid_until'),
  status: varchar('status', { length: 12 }).default('draft').notNull(),
  documentId: uuid('document_id'), // To be linked in Phase 8 (documents)
}, (table) => [
  check('quote_amount_check', sql`${table.amount} >= 0`),
  check('quote_status_check', sql`${table.status} IN ('draft', 'sent', 'accepted', 'rejected')`),
  index('quote_deal_idx').on(table.dealId),
]);
