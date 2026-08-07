const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('@next/env').loadEnvConfig(process.cwd());

const sql = postgres(process.env.DIRECT_URL);

async function applySQL(filename) {
  const filepath = path.join(__dirname, 'src', 'server', 'db', 'migrations', filename);
  const queries = fs.readFileSync(filepath, 'utf8');
  console.log(`Applying ${filename}...`);
  try {
    await sql.unsafe(queries);
    console.log(`Successfully applied ${filename}`);
  } catch (err) {
    console.error(`Failed to apply ${filename}:`, err);
  }
}

async function run() {
  await applySQL('0002_rls.sql');
  await applySQL('0003_hr_rls.sql');
  await applySQL('0004_crm_sales_rls.sql');
  await applySQL('0005_finance_rls.sql');
  await sql.end();
  console.log('All RLS policies restored.');
}

run();
