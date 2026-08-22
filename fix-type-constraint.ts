import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { sql } from 'drizzle-orm';

loadEnvConfig(process.cwd());

const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  console.log("Fixing project_type_check constraint...");
  await db.execute(sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS project_type_check;`);
  await db.execute(sql`ALTER TABLE projects ADD CONSTRAINT project_type_check CHECK (type IN ('solution', 'product', 'internal'));`);
  console.log("Constraint fixed.");
  process.exit(0);
}

main().catch(console.error);
