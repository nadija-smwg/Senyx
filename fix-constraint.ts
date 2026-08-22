import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { sql } from 'drizzle-orm';

loadEnvConfig(process.cwd());

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  console.log("Fixing constraint...");
  await db.execute(sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS project_account_required_check;`);
  await db.execute(sql`ALTER TABLE projects ADD CONSTRAINT project_account_required_check CHECK (type IN ('product', 'internal') OR account_id IS NOT NULL);`);
  console.log("Constraint fixed.");
  process.exit(0);
}

main().catch(console.error);
