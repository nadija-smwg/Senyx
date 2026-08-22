import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { projects } from './src/server/db/schema/projects';
import { desc } from 'drizzle-orm';

loadEnvConfig(process.cwd());
const db = drizzle(postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!));

async function main() {
  const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(5);
  console.log(allProjects.map(p => ({ code: p.code, name: p.name, created: p.createdAt })));
  process.exit(0);
}

main();
