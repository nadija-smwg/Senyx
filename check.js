const postgres = require('postgres');
require('@next/env').loadEnvConfig(process.cwd());
const sql = postgres(process.env.DIRECT_URL);

async function run() {
  const users = await sql`SELECT id, employee_id, email FROM users`;
  console.log("Users:", users);
  
  const emps = await sql`SELECT id, employee_code, email FROM employees`;
  console.log("Employees:", emps);
  
  await sql.end();
}
run().catch(console.error);
