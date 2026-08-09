import { db } from './src/server/db/client';
import { users } from './src/server/db/schema/identity';
import { projectAssignments } from './src/server/db/schema/projects';
import { employees } from './src/server/db/schema/hr';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('--- Users ---');
  const allUsers = await db.select().from(users);
  console.log(allUsers.map(u => ({ id: u.id, email: u.email, employeeId: u.employeeId })));

  console.log('--- Employees ---');
  const allEmployees = await db.select().from(employees);
  console.log(allEmployees.map(e => ({ id: e.id, email: e.email })));

  console.log('--- Project Assignments ---');
  const assignments = await db.select().from(projectAssignments);
  console.log(assignments.map(a => ({ id: a.id, projectId: a.projectId, employeeId: a.employeeId })));

  process.exit(0);
}

main();
