import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { issueInvoice } from '@/server/services/finance.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    // Real app: await checkRole(ctx.userId, ['finance', 'admin']);
    const id = (await params).id;
    const invoice = await issueInvoice(id, ctx.userId);
    return NextResponse.json({ data: invoice });
  } catch (error) {
    return handleError(error);
  }
}
