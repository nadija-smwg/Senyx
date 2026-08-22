import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { projects } from './src/server/db/schema/projects';
import { eq } from 'drizzle-orm';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const client = postgres(dbUrl);
const db = drizzle(client);

async function main() {
  console.log("Cleaning up test project...");
  await db.delete(projects).where(eq(projects.name, 'ppp'));
  console.log("Cleanup complete.");
  process.exit(0);
}

main().catch(console.error);
