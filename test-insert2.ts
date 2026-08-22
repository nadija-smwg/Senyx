import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { projects } from './src/server/db/schema/projects';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const client = postgres(dbUrl);
const db = drizzle(client);

async function main() {
  try {
    console.log("Inserting exact payload from user's second attempt...");
    await db.insert(projects).values({
      code: 'PRJ-TEST-2',
      name: 'test project',
      type: 'solution',
      companyName: 'aws',
      accountId: 'f530ef4e-0a6b-4cc5-b861-2d662e53134f',
      ownerId: 'e0ffe29d-8cd1-4c33-b783-cfebe5860905',
      billingType: 'fixed',
      status: 'planning',
      startDate: '2026-08-18',
      endDate: '2026-08-29',
      budget: '10000',
      currency: 'USD',
      createdBy: '290648d8-9b8a-4351-90b8-003628c90751',
    });
    console.log("Success");
  } catch (e: any) {
    console.error("DB Error:", e);
    console.error("Cause:", e.cause);
  }
  process.exit(0);
}

main();
