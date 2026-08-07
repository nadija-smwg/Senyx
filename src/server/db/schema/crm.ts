import { pgTable, uuid, varchar, text, jsonb, boolean, timestamp, check, unique, index } from 'drizzle-orm/pg-core';
import { baseColumns } from './base';
import { employees } from './hr';
import { sql } from 'drizzle-orm';

// ----------------------------------------------------------------------------
// ACCOUNTS (Client Companies)
// ----------------------------------------------------------------------------
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  name: varchar('name', { length: 120 }).notNull(),
  industry: varchar('industry', { length: 60 }),
  size: varchar('size', { length: 20 }), // e.g. 1-10, 11-50
  website: varchar('website', { length: 200 }),
  address: jsonb('address'), // { line1, city, country, etc }
  status: varchar('status', { length: 12 }).default('prospect').notNull(),
  ownerId: uuid('owner_id').references(() => employees.id),
}, (table) => [
  check('account_status_check', sql`${table.status} IN ('prospect', 'active', 'inactive')`),
  index('account_owner_idx').on(table.ownerId),
  // Partial index for active/prospect status
  index('account_status_active_idx').on(table.status).where(sql`${table.deletedAt} IS NULL`),
]);

// ----------------------------------------------------------------------------
// CONTACTS (People at Accounts)
// ----------------------------------------------------------------------------
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  firstName: varchar('first_name', { length: 60 }).notNull(),
  lastName: varchar('last_name', { length: 60 }),
  email: varchar('email', { length: 255 }), // citext equivalent if needed, using varchar
  phone: varchar('phone', { length: 30 }),
  title: varchar('title', { length: 80 }),
  isPrimary: boolean('is_primary').default(false).notNull(),
}, (table) => [
  index('contact_account_idx').on(table.accountId),
]);

// ----------------------------------------------------------------------------
// INTERACTIONS (Logs of calls, emails, meetings)
// ----------------------------------------------------------------------------
export const interactions = pgTable('interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  accountId: uuid('account_id').references(() => accounts.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  type: varchar('type', { length: 10 }).notNull(),
  subject: varchar('subject', { length: 160 }).notNull(),
  notes: text('notes'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  loggedById: uuid('logged_by').references(() => employees.id).notNull(),
}, (table) => [
  check('interaction_type_check', sql`${table.type} IN ('call', 'email', 'meeting', 'note')`),
  check('interaction_target_check', sql`${table.accountId} IS NOT NULL OR ${table.contactId} IS NOT NULL`),
  index('interaction_account_idx').on(table.accountId),
  index('interaction_contact_idx').on(table.contactId),
]);

// ----------------------------------------------------------------------------
// ACTIVITIES (Polymorphic Follow-up Tasks)
// ----------------------------------------------------------------------------
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  subject: varchar('subject', { length: 160 }).notNull(),
  type: varchar('type', { length: 20 }), // e.g. call, email, todo
  dueDate: timestamp('due_date', { withTimezone: true }),
  assigneeId: uuid('assignee_id').references(() => employees.id),
  relatedType: varchar('related_type', { length: 30 }), // 'account', 'deal', 'project'
  relatedId: uuid('related_id'), // Polymorphic target ID
  status: varchar('status', { length: 12 }).default('open').notNull(),
}, (table) => [
  check('activity_status_check', sql`${table.status} IN ('open', 'in_progress', 'done', 'cancelled')`),
  index('activity_assignee_idx').on(table.assigneeId),
  index('activity_related_idx').on(table.relatedType, table.relatedId),
]);

// ----------------------------------------------------------------------------
// TAGS & TAGGABLES (Polymorphic Tags)
// ----------------------------------------------------------------------------
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...baseColumns,
  name: varchar('name', { length: 40 }).notNull().unique(),
});

export const taggables = pgTable('taggables', {
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  taggableType: varchar('taggable_type', { length: 30 }).notNull(), // 'account', 'contact'
  taggableId: uuid('taggable_id').notNull(),
}, (table) => [
  unique('taggable_unique').on(table.tagId, table.taggableType, table.taggableId),
]);
