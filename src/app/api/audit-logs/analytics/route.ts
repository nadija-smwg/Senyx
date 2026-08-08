import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getAuditAnalytics } from '@/server/services/analytics.service';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    if (!ctx.roles.includes('admin') && !ctx.roles.includes('owner')) {
      throw new Error('Unauthorized');
    }

    const params = {
      user: req.nextUrl.searchParams.get('user') || undefined,
      module: req.nextUrl.searchParams.get('module') || undefined,
      dateRange: req.nextUrl.searchParams.get('startDate') ? {
        start: req.nextUrl.searchParams.get('startDate') || undefined,
        end: req.nextUrl.searchParams.get('endDate') || undefined
      } : undefined
    };

    const data = await getAuditAnalytics(ctx, params);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
