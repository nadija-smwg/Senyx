import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { reminderSchedules } from '@/server/db/schema/platform';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { handleError } from '@/server/middleware/error-handler';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    // requirePermission('settings', 'view')(ctx); // Assuming admin or settings access
    
    const schedules = await db.select().from(reminderSchedules).orderBy(reminderSchedules.createdAt);
    
    return NextResponse.json({ data: schedules });
  } catch (error) {
    return handleError(error);
  }
}
