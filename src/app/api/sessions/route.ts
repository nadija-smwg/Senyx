import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { sessions } from '@/server/db/schema/identity';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { handleError } from '@/server/middleware/error-handler';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'view')(ctx);

    const allSessions = await db.select().from(sessions).orderBy(desc(sessions.startedAt)).limit(100);
    return NextResponse.json({ data: allSessions });
  } catch (error) {
    return handleError(error);
  }
}
