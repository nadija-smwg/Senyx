import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as identity from './schema/identity';
import * as platform from './schema/platform';
import * as hr from './schema/hr';
import * as crm from './schema/crm';
import * as sales from './schema/sales';

// Create postgres connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

// Export drizzle db instance with all schemas
export const db = drizzle(client, { schema: { ...identity, ...platform, ...hr, ...crm, ...sales } });
