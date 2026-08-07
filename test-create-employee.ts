import './setup-env';
import { createEmployee } from './src/server/services/employee.service';
import { db } from './src/server/db/client';
import { designations } from './src/server/db/schema/hr';

async function run() {
  try {
    const desigs = await db.select().from(designations).limit(1);
    if (desigs.length === 0) throw new Error('No designations found');

    console.log('Testing Employee Creation...');
    const emp = await createEmployee({
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user.' + Date.now() + '@example.com',
      phone: '1234567890',
      designationId: desigs[0]!.id,
      employmentType: 'full_time',
      startDate: new Date().toISOString(),
      salary: '50000',
      nationalId: 'ID-12345'
    }, 'system-test-user-id');
    
    console.log('Employee created successfully!');
    console.log('Code:', emp!.employeeCode);
    console.log('Encrypted Salary:', emp!.salary);
    console.log('Encrypted National ID:', emp!.nationalId);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
