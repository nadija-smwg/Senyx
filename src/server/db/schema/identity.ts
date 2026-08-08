import { pgTable, uuid, text, boolean, timestamp, varchar, integer, inet, check, uniqueIndex, primaryKey, index, AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { baseColumns } from './base';
import { employees } from './hr';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id), // FK to employees
  email: text('email').notNull(), // Using text for citext equivalent in ORM without custom types
  isActive: boolean('is_active').default(true).notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...baseColumns,
}, (table) => [
  index('users_employee_id_idx').on(table.employeeId),
  uniqueIndex('users_employee_id_unique').on(table.employeeId).where(sql`deleted_at IS NULL`),
  uniqueIndex('users_email_unique').on(table.email).where(sql`deleted_at IS NULL`),
]);

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
  ...baseColumns,
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  module: varchar('module', { length: 30 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  scope: varchar('scope', { length: 10 }).notNull().default('all'),
  description: text('description'),
  ...baseColumns,
}, (table) => [
  check('action_check', sql`${table.action} IN ('view', 'create', 'edit', 'delete', 'export', 'approve')`),
  check('scope_check', sql`${table.scope} IN ('all', 'own', 'assigned')`),
  uniqueIndex('module_action_scope_idx').on(table.module, table.action, table.scope),
]);

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
]);

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.roleId] }),
]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  ipAddress: text('ip_address'), // text due to lack of strict inet support in some drivers
  device: varchar('device', { length: 60 }),
  os: varchar('os', { length: 60 }),
  browser: varchar('browser', { length: 60 }),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('duration_check', sql`${table.durationSeconds} >= 0`),
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_user_started_idx').on(table.userId, table.startedAt),
]);

