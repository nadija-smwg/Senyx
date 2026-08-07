const postgres = require('postgres');
require('@next/env').loadEnvConfig(process.cwd());
const sql = postgres(process.env.DIRECT_URL);

async function run() {
  try {
    const users = await sql`SELECT id, employee_id, email FROM users`;
    
    // Create a default designation
    const [des] = await sql`INSERT INTO designations (title) VALUES ('Admin Placeholder') ON CONFLICT (title) DO UPDATE SET title = 'Admin Placeholder' RETURNING id`;
    
    for (const u of users) {
      // Check if employee exists
      const existing = await sql`SELECT id FROM employees WHERE id = ${u.employee_id}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO employees (
            id, employee_code, first_name, last_name, email, 
            designation_id, employment_type, start_date, status
          ) VALUES (
            ${u.employee_id},
            'SYS-' || left(replace(${u.employee_id}::text, '-', ''), 6),
            'System',
            'Admin',
            ${u.email},
            ${des.id},
            'full_time',
            CURRENT_DATE,
            'active'
          )
        `;
        console.log(`Created employee for user ${u.email}`);
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}
run();
