import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../server/middleware/auth';
import { handleError } from '../../../server/middleware/error-handler';
import { db } from '../../../server/db/client';
import { performanceReviews } from '../../../server/db/schema/hr';
import { eq } from 'drizzle-orm';
import { UnauthorizedError } from '../../../server/types/errors';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    
    let records;
    if (isAdminOrHR) {
      records = await db.select().from(performanceReviews);
    } else {
      if (!ctx.employeeId) throw new UnauthorizedError('No employee profile associated');
      records = await db.select().from(performanceReviews).where(eq(performanceReviews.employeeId, ctx.employeeId));
    }

    return NextResponse.json({ data: records });
  } catch (error) {
    return handleError(error);
  }
}
