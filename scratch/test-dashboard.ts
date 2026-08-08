import { getAdminDashboard } from '../src/server/services/analytics.service';
import { db } from '../src/server/db/client';

async function test() {
  try {
    const data = await getAdminDashboard({
      userId: 'test',
      sessionId: 'test',
      roles: ['admin'],
      permissions: []
    } as any);
    console.log(data);
  } catch (e) {
    console.error('ERROR:', e);
  }
}
test();
