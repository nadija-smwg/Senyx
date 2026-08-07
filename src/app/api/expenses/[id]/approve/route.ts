import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { approveExpense } from '@/server/services/expense.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    // Real app: await checkRole(ctx.userId, ['finance', 'admin']);
    const id = (await params).id;
    const { decision } = await req.json(); // 'approved' or 'rejected'
    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }
    const expense = await approveExpense(id, decision, ctx.userId);
    return NextResponse.json({ data: expense });
  } catch (error) {
    return handleError(error);
  }
}
