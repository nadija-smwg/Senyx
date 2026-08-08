import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { executeQuery } from '@/server/services/analytics.service';

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const data = await executeQuery(ctx, body);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
