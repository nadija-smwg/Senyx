import { generateReportData, exportReportToCSV } from './src/server/services/report.service';
import { AuthContext } from './src/server/types/context';

async function run() {
  console.log('--- Testing Report Service ---');
  
  const adminCtx: AuthContext = {
    userId: 'mock-user-id',
    roles: ['admin'],
    permissions: [],
    sessionId: 'mock-session',
    deviceInfo: { device: null, os: null, browser: null, userAgent: null },
    ip: '127.0.0.1',
    apiRoute: '/mock'
  };

  try {
    console.log('\n--- Project Profitability ---');
    const profitability = await generateReportData(adminCtx, 'project-profitability', {}) as any[];
    console.log(`Returned ${profitability.length} rows`);
    console.log(profitability.slice(0, 2));

    console.log('\n--- Contribution ---');
    const contribution = await generateReportData(adminCtx, 'contribution', {}) as any[];
    console.log(`Returned ${contribution.length} rows`);
    console.log(contribution.slice(0, 2));

    console.log('\n--- CSV Export Test ---');
    const csv = exportReportToCSV([{ name: 'Test', value: 123 }]);
    console.log('CSV output:', csv);

    console.log('\nAll tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
