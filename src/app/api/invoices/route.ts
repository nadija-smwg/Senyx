import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listInvoices, createInvoice } from '@/server/services/finance.service';
import { ForbiddenError, ValidationError } from '@/server/types/errors';
import { z } from 'zod';

const FINANCE_ROLES = ['Admin', 'Finance'];

const CreateInvoiceSchema = z.object({
  accountId: z.string().uuid(),
  projectId: z.string().uuid().nullable().optional(),
  type: z.enum(['standard', 'proforma', 'credit_note']).optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  currency: z.string().max(3).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    amount: z.number().nonnegative(),
  })).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);

    // Finance, Admin and Project Owners can view invoices
    const canView =
      ctx.roles.some((r) => FINANCE_ROLES.includes(r)) ||
      ctx.roles.includes('Project Owner');
    if (!canView) {
      throw new ForbiddenError('You do not have permission to view invoices.');
    }

    const searchParams = req.nextUrl.searchParams;
    const params = {
      status: searchParams.get('status') || undefined,
      accountId: searchParams.get('accountId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      minAmount: searchParams.get('minAmount') || undefined,
      maxAmount: searchParams.get('maxAmount') || undefined,
    };
    const invoices = await listInvoices(params);
    return NextResponse.json({ data: invoices });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);

    // Only Finance and Admin can create invoices
    const canCreate = ctx.roles.some((r) => FINANCE_ROLES.includes(r));
    if (!canCreate) {
      throw new ForbiddenError('Only Finance managers and Admins can create invoices.');
    }

    const body = await req.json();
    const validatedData = CreateInvoiceSchema.parse(body);
    const invoice = await createInvoice(validatedData, ctx.userId);
    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
