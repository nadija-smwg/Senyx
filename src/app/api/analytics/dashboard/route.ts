import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getDashboard } from '@/server/services/analytics.service';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    // Parse optional date range
    const start = req.nextUrl.searchParams.get('startDate');
    const end = req.nextUrl.searchParams.get('endDate');
    const dateRange = start || end ? { start: start || undefined, end: end || undefined } : undefined;

    const data = await getDashboard(ctx, dateRange);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
