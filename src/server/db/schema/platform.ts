import { pgTable, uuid, varchar, text, jsonb, timestamp, check, unique, index, boolean } from 'drizzle-orm/pg-core';
import { baseColumns } from './base';
import { users, sessions } from './identity';
import { sql } from 'drizzle-orm';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  roleInEffect: varchar('role_in_effect', { length: 50 }),
  sessionId: uuid('session_id').references(() => sessions.id),
  action: varchar('action', { length: 60 }).notNull(),
  apiRoute: varchar('api_route', { length: 160 }).notNull(),
  entityType: varchar('entity_type', { length: 40 }),
  entityId: uuid('entity_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  device: varchar('device', { length: 60 }),
  os: varchar('os', { length: 60 }),
  browser: varchar('browser', { length: 60 }),
  ipAddress: text('ip_address'),
  result: varchar('result', { length: 8 }).notNull(),
  errorCode: varchar('error_code', { length: 40 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('result_check', sql`${table.result} IN ('success', 'failure')`),
  index('audit_actor_created_idx').on(table.actorId, table.createdAt),
  index('audit_entity_idx').on(table.entityType, table.entityId),
  index('audit_api_route_idx').on(table.apiRoute),
]);

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 60 }).notNull().unique(),
  value: jsonb('value').notNull(),
  ...baseColumns,
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 60 }).notNull(),
  title: varchar('title', { length: 160 }).notNull(),
  body: text('body').notNull(),
  relatedType: varchar('related_type', { length: 60 }),
  relatedId: uuid('related_id'),
  channel: varchar('channel', { length: 40 }).notNull(), // e.g. 'in_app', 'email'
  isRead: boolean('is_read').default(false).notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  ...baseColumns,
}, (table) => [
  index('notifications_user_is_read_idx').on(table.userId, table.isRead),
  index('notifications_user_created_idx').on(table.userId, table.createdAt),
]);

export const reminderSchedules = pgTable('reminder_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 160 }).notNull(),
  type: varchar('type', { length: 60 }).notNull(), // e.g., 'due_date', 'approval'
  target: varchar('target', { length: 60 }).notNull(), // e.g., 'assignee', 'manager'
  advanceDays: varchar('advance_days', { length: 60 }), // e.g., '1,3,7'
  digestTime: varchar('digest_time', { length: 10 }), // e.g., '09:00'
  isActive: boolean('is_active').default(true).notNull(),
  ...baseColumns,
}, (table) => [
  index('reminder_schedules_type_active_idx').on(table.type, table.isActive),
]);

