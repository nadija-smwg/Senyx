import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getActiveClock } from '@/server/services/time.service';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const data = await getActiveClock(ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
