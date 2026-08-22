import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { employees, leaveBalances, leaveTypes, designations } from './src/server/db/schema/hr';
import { eq } from 'drizzle-orm';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  console.log("Fixing leave balances...");
  const currentYear = new Date().getFullYear();
  
  const allEmployees = await db.select().from(employees);
  const allLeaveTypes = await db.select().from(leaveTypes);
  const allDesignations = await db.select().from(designations);

  let insertedCount = 0;

  for (const emp of allEmployees) {
    const existingBalances = await db.select().from(leaveBalances)
      .where(eq(leaveBalances.employeeId, emp.id));
      
    if (existingBalances.length === 0) {
      const empDesignation = allDesignations.find(d => d.id === emp.designationId);
      const annualLeaveDays = empDesignation?.annualLeaveDays || '30.00';

      const balancesToInsert = allLeaveTypes.map(lt => ({
        employeeId: emp.id,
        leaveTypeId: lt.id,
        year: currentYear,
        balanceDays: lt.name === 'Annual' ? annualLeaveDays : lt.defaultAnnualDays,
      }));
      
      if (balancesToInsert.length > 0) {
        await db.insert(leaveBalances).values(balancesToInsert);
        insertedCount += balancesToInsert.length;
      }
    }
  }

  console.log(`Inserted ${insertedCount} leave balances for existing employees.`);
  process.exit(0);
}

main().catch(console.error);
