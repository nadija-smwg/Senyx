import { db } from '../db/client';
import { employees } from '../db/schema/hr';
import { desc, like } from 'drizzle-orm';

export async function generateEmployeeCode(): Promise<string> {
  const latestEmployee = await db
    .select({ code: employees.employeeCode })
    .from(employees)
    .where(like(employees.employeeCode, 'SNX-%'))
    .orderBy(desc(employees.employeeCode))
    .limit(1);

  if (latestEmployee.length === 0) {
    return 'SNX-0001';
  }

  const latestCode = latestEmployee[0]?.code || '';
  const parts = latestCode.split('-');
  
  if (parts.length !== 2) {
    return 'SNX-0001';
  }

  const numPart = parseInt(parts[1] || '0', 10);
  if (isNaN(numPart)) {
    return 'SNX-0001';
  }

  const nextNum = numPart + 1;
  return `SNX-${nextNum.toString().padStart(4, '0')}`;
}
