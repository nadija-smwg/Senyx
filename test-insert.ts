import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { projects } from './src/server/db/schema/projects';
import { employees } from './src/server/db/schema/hr';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Force use direct URL to bypass pgbouncer issues in scripts if needed
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const client = postgres(dbUrl);
const db = drizzle(client);

async function main() {
  try {
    const allEmps = await db.select().from(employees).limit(1);
    if (allEmps.length === 0) throw new Error("No employees");
    
    console.log("Inserting project...");
    await db.insert(projects).values({
      code: 'TEST-' + Math.floor(Math.random() * 10000),
      name: 'ppp',
      type: 'internal',
      companyName: 'uper',
      ownerId: allEmps[0].id,
      billingType: 'fixed',
      status: 'planning',
      startDate: '2026-08-18',
      endDate: '2026-08-18',
      budget: '100',
      currency: 'USD',
      createdBy: '00000000-0000-0000-0000-000000000000',
    });
    console.log("Success");
  } catch (e) {
    console.error("DB Error:", e);
  }
  process.exit(0);
}

main();
