import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { roles, permissions, rolePermissions, users, userRoles } from './schema/identity';
import { departments, designations, leaveTypes, skills, employees } from './schema/hr';
import crypto from 'crypto';
import { settings } from './schema/platform';
import { eq } from 'drizzle-orm';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function main() {
  console.log("Seeding database...");

  // 1. Settings — values must be valid JSON for jsonb column
  await db.insert(settings).values([
    { key: 'company.name', value: JSON.stringify('SENYX Corporation') },
    { key: 'company.currency', value: JSON.stringify('USD') },
    { key: 'finance.tax_rate', value: JSON.stringify(0.10) },
    { key: 'invoice.auto_issue', value: JSON.stringify(true) },
    { key: 'session.timeout_minutes', value: JSON.stringify(480) },
    { key: 'session.max_concurrent', value: JSON.stringify(3) },
  ]).onConflictDoNothing({ target: settings.key });

  // 2. Roles
  const defaultRoles = [
    { name: 'Admin', isSystem: true, description: 'Super Administrator' },
    { name: 'Finance', isSystem: false, description: 'Finance Manager' },
    { name: 'HR Manager', isSystem: false, description: 'Human Resources Manager' },
    { name: 'Sales Lead', isSystem: false, description: 'Sales Team Lead' },
    { name: 'Project Owner', isSystem: false, description: 'Project Manager' },
    { name: 'Employee', isSystem: false, description: 'Standard Employee' },
    { name: 'Auditor', isSystem: false, description: 'Read-only Auditor' },
  ];

  for (const role of defaultRoles) {
    await db.insert(roles).values(role).onConflictDoNothing({ target: roles.name });
  }

  // 3. Permissions Matrix
  const modules = ['sales', 'projects', 'finance', 'hr', 'analytics', 'audit', 'settings', 'crm'];
  const actions = ['view', 'create', 'edit', 'delete', 'export', 'approve'];
  const scopes = ['all', 'own', 'assigned'];

  const permsToInsert = [];
  for (const mod of modules) {
    for (const act of actions) {
      for (const scp of scopes) {
        permsToInsert.push({ module: mod, action: act, scope: scp, description: `${act} ${scp} on ${mod}` });
      }
    }
  }
  
  await db.insert(permissions).values(permsToInsert).onConflictDoNothing({ target: [permissions.module, permissions.action, permissions.scope] });

  // 4. Role Permissions (Map Admin to ALL)
  const allRoles = await db.select().from(roles);
  const adminRole = allRoles.find((r) => r.name === 'Admin');
  const allPerms = await db.select().from(permissions);

  if (adminRole) {
    const adminRolePerms = allPerms.map(p => ({
      roleId: adminRole.id,
      permissionId: p.id,
    }));
    await db.insert(rolePermissions).values(adminRolePerms).onConflictDoNothing();
  }

  // 5. HR Designations
  const defaultDesignations = [
    'CEO', 'CTO', 'COO', 'Project Manager', 'Senior Developer', 
    'Developer', 'ML Engineer', 'Data Scientist', 'Business Analyst', 
    'UI/UX Designer', 'QA Engineer', 'DevOps Engineer', 'HR Executive', 
    'Finance Executive', 'Sales Executive'
  ].map(title => ({ title }));

  for (const des of defaultDesignations) {
    await db.insert(designations).values(des).onConflictDoNothing({ target: designations.title });
  }

  // 6. HR Departments
  const defaultDepartments = [
    'Engineering', 'Design', 'Sales', 'HR', 'Finance', 'Operations'
  ].map(name => ({ name }));

  for (const dep of defaultDepartments) {
    await db.insert(departments).values(dep).onConflictDoNothing({ target: departments.name });
  }

  // 7. HR Leave Types
  const defaultLeaveTypes = [
    { name: 'Annual', defaultAnnualDays: '14.00' },
    { name: 'Sick', defaultAnnualDays: '7.00' },
    { name: 'Casual', defaultAnnualDays: '7.00' },
    { name: 'Maternity', defaultAnnualDays: '84.00' },
    { name: 'Paternity', defaultAnnualDays: '3.00' },
  ];

  for (const lt of defaultLeaveTypes) {
    await db.insert(leaveTypes).values(lt).onConflictDoNothing({ target: leaveTypes.name });
  }

  // 8. HR Skills
  const defaultSkills = [
    'JavaScript', 'TypeScript', 'Python', 'React', 'Next.js', 'PostgreSQL', 
    'Machine Learning', 'Docker', 'AWS', 'Figma'
  ].map(name => ({ name }));

  for (const sk of defaultSkills) {
    await db.insert(skills).values(sk).onConflictDoNothing({ target: skills.name });
  }

  // 9. Reminder Schedules
  const { reminderSchedules } = require('./schema/platform');
  const defaultSchedules = [
    {
      name: 'Project Due Dates',
      type: 'project_due_dates',
      target: 'project_owner',
      advanceDays: '1,3,7',
      digestTime: '08:00',
      isActive: true,
    }
  ];

  for (const rs of defaultSchedules) {
    // using name as unique although not strictly unique in schema, but good enough for seed if we check it.
    const existing = await db.select().from(reminderSchedules).where(eq(reminderSchedules.name, rs.name));
    if (existing.length === 0) {
      await db.insert(reminderSchedules).values(rs);
    }
  }

  // 10. Seed Accounts (Employees and Users)
  const defaultAccounts = [
    { email: 'admin@senyx.com', first: 'Alice', last: 'Admin', role: 'Admin', code: 'EMP-001', desig: 'CEO', dept: 'Operations' },
    { email: 'hr@senyx.com', first: 'Bob', last: 'Human', role: 'HR Manager', code: 'EMP-002', desig: 'HR Executive', dept: 'HR' },
    { email: 'finance@senyx.com', first: 'Carol', last: 'Cash', role: 'Finance', code: 'EMP-003', desig: 'Finance Executive', dept: 'Finance' },
    { email: 'sales@senyx.com', first: 'Dave', last: 'Deal', role: 'Sales Lead', code: 'EMP-004', desig: 'Sales Executive', dept: 'Sales' },
    { email: 'project@senyx.com', first: 'Eve', last: 'Planner', role: 'Project Owner', code: 'EMP-005', desig: 'Project Manager', dept: 'Engineering' },
    { email: 'employee@senyx.com', first: 'Frank', last: 'Worker', role: 'Employee', code: 'EMP-006', desig: 'Developer', dept: 'Engineering' }
  ];

  const allDesigs = await db.select().from(designations);
  const allDepts = await db.select().from(departments);

  for (const acc of defaultAccounts) {
    const desig = allDesigs.find(d => d.title === acc.desig);
    const dept = allDepts.find(d => d.name === acc.dept);
    const role = allRoles.find(r => r.name === acc.role);

    if (desig && dept && role) {
      // 1. Insert Employee
      const empResult = await db.insert(employees).values({
        employeeCode: acc.code,
        firstName: acc.first,
        lastName: acc.last,
        email: acc.email,
        designationId: desig.id,
        departmentId: dept.id,
        employmentType: 'full_time',
        startDate: new Date().toISOString().split('T')[0]!,
        status: 'active'
      }).onConflictDoNothing({ target: employees.email }).returning({ id: employees.id });

      let empId = empResult.length > 0 ? empResult[0]?.id : null;
      if (!empId) {
        const existingEmp = await db.select().from(employees).where(eq(employees.email, acc.email));
        if (existingEmp.length > 0) empId = existingEmp[0]?.id;
      }

      if (empId) {
        // 2. Insert User (Using predictable crypto.randomUUID or db generated)
        const userResult = await db.insert(users).values({
          id: crypto.randomUUID(), // Assuming Node.js env where crypto is available globally
          employeeId: empId,
          email: acc.email,
          isActive: true
        }).onConflictDoNothing({ target: users.email }).returning({ id: users.id });

        let userId = userResult.length > 0 ? userResult[0]?.id : null;
        if (!userId) {
          const existingUser = await db.select().from(users).where(eq(users.email, acc.email));
          if (existingUser.length > 0) userId = existingUser[0]?.id;
        }

        if (userId) {
          // 3. Insert User Role
          await db.insert(userRoles).values({
            userId: userId,
            roleId: role.id
          }).onConflictDoNothing();
        }
      }
    }
  }

  console.log("Seeding completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
