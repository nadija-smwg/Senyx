import { pgTable, uuid, text, boolean, timestamp, varchar, integer, smallint, date, numeric, jsonb, check, unique, primaryKey, index, AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { baseColumns } from './base';

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  description: text('description'),
  ...baseColumns,
});

export const designations = pgTable('designations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 80 }).notNull().unique(),
  description: text('description'),
  annualLeaveDays: numeric('annual_leave_days', { precision: 5, scale: 2 }).default('30.00').notNull(),
  ...baseColumns,
});

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeCode: varchar('employee_code', { length: 20 }).notNull().unique(),
  firstName: varchar('first_name', { length: 60 }).notNull(),
  lastName: varchar('last_name', { length: 60 }).notNull(),
  email: text('email').notNull().unique(),
  phone: varchar('phone', { length: 30 }),
  designationId: uuid('designation_id').notNull().references(() => designations.id),
  departmentId: uuid('department_id').references(() => departments.id),
  managerId: uuid('manager_id').references((): AnyPgColumn => employees.id),
  employmentType: varchar('employment_type', { length: 15 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: varchar('status', { length: 15 }).default('active').notNull(),
  salary: text('salary'), // Encrypted string
  bankDetails: text('bank_details'), // Encrypted string
  nationalId: text('national_id'), // Encrypted string
  emergencyContact: jsonb('emergency_contact'), // { name, phone, relation }
  ...baseColumns,
}, (table) => [
  check('employment_type_check', sql`${table.employmentType} IN ('full_time', 'part_time', 'contract', 'intern')`),
  check('status_check', sql`${table.status} IN ('active', 'on_leave', 'suspended', 'terminated')`),
  index('employees_designation_idx').on(table.designationId),
  index('employees_department_idx').on(table.departmentId),
  index('employees_manager_idx').on(table.managerId),
  index('employees_active_idx').on(table.status).where(sql`${table.deletedAt} IS NULL`),
]);

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 60 }).notNull().unique(),
  category: varchar('category', { length: 40 }),
  ...baseColumns,
});

export const employeeSkills = pgTable('employee_skills', {
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
  proficiency: smallint('proficiency').notNull(),
  certified: boolean('certified').default(false).notNull(),
  certifiedAt: date('certified_at'),
}, (table) => [
  primaryKey({ columns: [table.employeeId, table.skillId] }),
  check('proficiency_check', sql`${table.proficiency} BETWEEN 1 AND 5`),
]);

export const leaveTypes = pgTable('leave_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 40 }).notNull().unique(),
  defaultAnnualDays: numeric('default_annual_days', { precision: 5, scale: 2 }).notNull(),
  ...baseColumns,
}, (table) => [
  check('annual_days_check', sql`${table.defaultAnnualDays} >= 0`),
]);

export const leaveBalances = pgTable('leave_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id, { onDelete: 'cascade' }),
  year: smallint('year').notNull(),
  balanceDays: numeric('balance_days', { precision: 5, scale: 2 }).notNull(),
  ...baseColumns,
}, (table) => [
  check('balance_days_check', sql`${table.balanceDays} >= 0`),
  unique('leave_balances_emp_type_year_idx').on(table.employeeId, table.leaveTypeId, table.year),
]);

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id, { onDelete: 'cascade' }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  days: numeric('days', { precision: 5, scale: 2 }).notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 12 }).default('pending').notNull(),
  approverId: uuid('approver_id').references(() => employees.id),
  approverComment: text('approver_comment'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  ...baseColumns,
}, (table) => [
  check('days_check', sql`${table.days} > 0`),
  check('status_check', sql`${table.status} IN ('pending', 'approved', 'rejected', 'cancelled')`),
  index('leave_requests_emp_status_idx').on(table.employeeId, table.status),
]);

export const payrollRecords = pgTable('payroll_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  periodMonth: smallint('period_month').notNull(),
  periodYear: smallint('period_year').notNull(),
  gross: text('gross').notNull(), // Encrypted string
  deductions: numeric('deductions', { precision: 14, scale: 2 }).default('0').notNull(),
  net: text('net').notNull(), // Encrypted string
  currency: varchar('currency', { length: 3 }).notNull(),
  components: jsonb('components'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  ...baseColumns,
}, (table) => [
  check('month_check', sql`${table.periodMonth} BETWEEN 1 AND 12`),
  check('deductions_check', sql`${table.deductions} >= 0`),
  unique('payroll_emp_period_idx').on(table.employeeId, table.periodYear, table.periodMonth),
  index('payroll_records_emp_year_idx').on(table.employeeId, table.periodYear),
]);

export const performanceReviews = pgTable('performance_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewer_id').notNull().references(() => employees.id),
  period: varchar('period', { length: 20 }).notNull(),
  rating: smallint('rating'),
  goals: jsonb('goals'),
  notes: text('notes'),
  ...baseColumns,
}, (table) => [
  check('rating_check', sql`${table.rating} BETWEEN 1 AND 5`),
]);
