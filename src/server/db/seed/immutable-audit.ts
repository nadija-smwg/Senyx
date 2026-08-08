import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { db } from '../client';
import { sql } from 'drizzle-orm';

console.log("DB URL from env:", process.env.DIRECT_URL || process.env.DATABASE_URL);

async function main() {
  console.log('Applying immutable audit logs trigger...');
  
  try {
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION prevent_audit_modification()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Audit logs cannot be modified or deleted';
      END;
      $$ LANGUAGE plpgsql;
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS trg_audit_immutable ON audit_logs;
    `);

    await db.execute(sql`
      CREATE TRIGGER trg_audit_immutable
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
    `);

    console.log('✅ Successfully applied immutable trigger on audit_logs');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to apply trigger:', err);
    process.exit(1);
  }
}

main();
