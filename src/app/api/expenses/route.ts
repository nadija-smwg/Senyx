import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listExpenses, createExpense } from '@/server/services/expense.service';
import { ForbiddenError } from '@/server/types/errors';
import { z } from 'zod';

const FINANCE_ROLES = ['Admin', 'Finance'];

const CreateExpenseSchema = z.object({
  employeeId: z.string().uuid().optional(),
  projectId: z.string().uuid().nullable().optional(),
  category: z.string().max(80),
  amount: z.number().positive(),
  currency: z.string().max(3).optional(),
  expenseDate: z.string(),
  description: z.string().max(500).optional(),
  receiptKey: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const searchParams = req.nextUrl.searchParams;

    const isFinanceOrAdmin = ctx.roles.some((r) => FINANCE_ROLES.includes(r));

    // Build params; employees can only see their own expenses
    const params = {
      approvalStatus: searchParams.get('approvalStatus') || undefined,
      category: searchParams.get('category') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      // Non-admin/finance users are scoped to their own employee record
      employeeId: isFinanceOrAdmin
        ? searchParams.get('employeeId') || undefined
        : ctx.employeeId || undefined,
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
    const validatedData = CreateExpenseSchema.parse(body);

    // Employees can only submit expenses for themselves
    const isFinanceOrAdmin = ctx.roles.some((r) => FINANCE_ROLES.includes(r));
    if (!isFinanceOrAdmin && validatedData.employeeId && validatedData.employeeId !== ctx.employeeId) {
      throw new ForbiddenError('You can only submit expenses for yourself.');
    }

    // Default employeeId to the current user's employee
    const expenseData = {
      ...validatedData,
      employeeId: isFinanceOrAdmin ? (validatedData.employeeId || ctx.employeeId) : ctx.employeeId,
    };

    const expense = await createExpense(expenseData, ctx.userId);
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
