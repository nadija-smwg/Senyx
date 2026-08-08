import { getDashboard, getAuditAnalytics, executeQuery } from './src/server/services/analytics.service';
import { AuthContext } from './src/server/types/context';

async function run() {
  console.log('--- Testing Analytics Service ---');
  
  const adminCtx: AuthContext = {
    userId: 'mock-user-id',
    roles: ['admin'],
    permissions: [],
    sessionId: 'mock-session',
    deviceInfo: { device: null, os: null, browser: null, userAgent: null },
    ip: '127.0.0.1',
    apiRoute: '/mock'
  };

  const salesCtx: AuthContext = { ...adminCtx, roles: ['Sales Lead'] };
  const projectCtx: AuthContext = { ...adminCtx, roles: ['Project Owner'], employeeId: 'mock-emp' };

  try {
    console.log('\n--- Admin Dashboard ---');
    const adminRes = await getDashboard(adminCtx);
    console.log(adminRes);

    console.log('\n--- Sales Dashboard ---');
    const salesRes = await getDashboard(salesCtx);
    console.log(salesRes);

    console.log('\n--- Project Dashboard ---');
    const projectRes = await getDashboard(projectCtx);
    console.log(projectRes);

    console.log('\n--- Audit Analytics ---');
    const auditRes = await getAuditAnalytics(adminCtx, {});
    console.log('Audit analytics fetched successfully. Top users count:', auditRes.topUsers.length);

    console.log('\n--- Execute Query (Deals) ---');
    const queryRes = await executeQuery(adminCtx, { module: 'deals', groupBy: ['stage'] });
    console.log('Query result length:', queryRes.length);

    console.log('\nAll tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
