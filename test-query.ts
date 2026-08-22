import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { sql } from 'drizzle-orm';

loadEnvConfig(process.cwd());

const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  const result = await db.execute(sql`
    SELECT pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conname = 'project_type_check'
  `);
  console.log(result);
  process.exit(0);
}
main();
