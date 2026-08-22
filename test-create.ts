import { createProject } from './src/server/services/project.service';
import { loadEnvConfig } from '@next/env';
import { db } from './src/server/db/client';
import { employees } from './src/server/db/schema/hr';

loadEnvConfig(process.cwd());

async function main() {
  try {
    const allEmps = await db.select().from(employees).limit(1);
    const firstEmp = allEmps[0];
    if (!firstEmp) {
      console.log("No employees found");
      process.exit(1);
    }
    const empId = firstEmp.id;
    // mock user id
    const userId = '00000000-0000-0000-0000-000000000000'; // this might fail if users table has FK constraint on createdBy
    
    // We will just call the service and see what it throws
    const input = {
      name: "ppp",
      companyName: "uper",
      accountId: null,
      ownerId: empId,
      type: "internal",
      billingType: "fixed",
      budget: 100,
      currency: "USD",
      startDate: "2026-08-18",
      endDate: "2026-08-18"
    };

    console.log("Creating project...");
    await createProject(input, userId, empId);
    console.log("Success");
  } catch (e: any) {
    console.error("Error creating project:", e);
  }
  process.exit(0);
}

main();
