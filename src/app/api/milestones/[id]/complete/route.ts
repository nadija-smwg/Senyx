import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { completeMilestone } from '@/server/services/milestone.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const data = await completeMilestone((await params).id, ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
