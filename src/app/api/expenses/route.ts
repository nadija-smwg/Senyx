import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listExpenses, createExpense } from '@/server/services/expense.service';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const searchParams = req.nextUrl.searchParams;
    const params = {
      approvalStatus: searchParams.get('approvalStatus') || undefined,
      category: searchParams.get('category') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };
    const expenses = await listExpenses(params);
    return NextResponse.json({ data: expenses });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const expense = await createExpense(body, ctx.userId);
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
