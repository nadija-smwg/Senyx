import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { clockOut } from '@/server/services/time.service';

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const data = await clockOut(ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
