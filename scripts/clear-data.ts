import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { eq, ne, sql } from 'drizzle-orm';

import { changeRequests, notifications } from '../src/server/db/schema/platform';
import { payrollRecords, performanceReviews, leaveRequests, leaveBalances, employeeSkills, employees } from '../src/server/db/schema/hr';
import { invoices, invoiceLineItems, payments, expenses, subscriptions } from '../src/server/db/schema/finance';
import { projectLinks, projectRisks, timeEntries, clockSessions, paymentMilestones, milestones, tasks, boardColumns, projectAssignments, projects } from '../src/server/db/schema/projects';
import { quotes, dealStageHistory, deals } from '../src/server/db/schema/sales';
import { taggables, activities, interactions, contacts, accounts } from '../src/server/db/schema/crm';
import { sessions, users, userRoles } from '../src/server/db/schema/identity';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL!;
if (!dbUrl) {
  console.error("No database URL found");
  process.exit(1);
}

const client = postgres(dbUrl);
const db = drizzle(client);

async function main() {
  const adminEmail = 'admin@senyx.com';
  console.log(`Starting data cleanup. Keeping user: ${adminEmail}`);

  // 1. Get Admin User and Employee IDs to preserve them
  const [adminUser] = await db.select().from(users).where(eq(users.email, adminEmail));
  
  if (!adminUser) {
    console.warn(`Admin user ${adminEmail} not found in database. Proceeding with caution.`);
  }

  const [adminEmployee] = await db.select().from(employees).where(eq(employees.email, adminEmail));

  const adminUserId = adminUser?.id;
  const adminEmployeeId = adminEmployee?.id;

  console.log('--- Clearing operational data ---');
  
  // Platform (Bypass trigger on audit_logs)
  await db.execute(sql`TRUNCATE TABLE audit_logs CASCADE`);
  await db.delete(changeRequests);
  await db.delete(notifications);

  // HR transactional data
  await db.delete(payrollRecords);
  await db.delete(performanceReviews);
  await db.delete(leaveRequests);
  await db.delete(leaveBalances);
  await db.delete(employeeSkills);

  // Finance
  await db.delete(payments);
  await db.delete(invoiceLineItems);
  await db.delete(invoices);
  await db.delete(subscriptions);
  await db.delete(expenses);

  // Projects
  await db.delete(projectLinks);
  await db.delete(projectRisks);
  await db.delete(timeEntries);
  await db.delete(clockSessions);
  await db.delete(paymentMilestones);
  await db.delete(milestones);
  await db.delete(tasks);
  await db.delete(boardColumns);
  await db.delete(projectAssignments);
  await db.delete(projects);

  // Sales
  await db.delete(quotes);
  await db.delete(dealStageHistory);
  await db.delete(deals);

  // CRM
  await db.delete(taggables);
  await db.delete(activities);
  await db.delete(interactions);
  await db.delete(contacts);
  await db.delete(accounts);

  // Sessions
  await db.delete(sessions);

  console.log('--- Clearing test users and employees ---');
  
  // Users
  if (adminUserId) {
    await db.delete(userRoles).where(ne(userRoles.userId, adminUserId));
    await db.delete(users).where(ne(users.id, adminUserId));
  } else {
    await db.delete(userRoles);
    await db.delete(users);
  }

  // Employees
  if (adminEmployeeId) {
    await db.update(employees).set({ managerId: null });
    await db.delete(employees).where(ne(employees.id, adminEmployeeId));
  } else {
    await db.update(employees).set({ managerId: null });
    await db.delete(employees);
  }

  console.log("Cleanup complete!");
  process.exit(0);
}

main().catch(err => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
