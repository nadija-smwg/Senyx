import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listPayments, recordPayment } from '@/server/services/payment.service';
import { ForbiddenError } from '@/server/types/errors';
import { z } from 'zod';

const FINANCE_ROLES = ['Admin', 'Finance'];

const RecordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().max(3).optional(),
  method: z.string().max(50).optional(),
  reference: z.string().max(200).optional(),
  paidAt: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);

    // Only Finance and Admin can view payment records
    const canView = ctx.roles.some((r) => FINANCE_ROLES.includes(r));
    if (!canView) {
      throw new ForbiddenError('You do not have permission to view payments.');
    }

    const payments = await listPayments();
    return NextResponse.json({ data: payments });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);

    // Only Finance and Admin can record payments
    const canCreate = ctx.roles.some((r) => FINANCE_ROLES.includes(r));
    if (!canCreate) {
      throw new ForbiddenError('Only Finance managers and Admins can record payments.');
    }

    const body = await req.json();
    const validatedData = RecordPaymentSchema.parse(body);
    const payment = await recordPayment(validatedData, ctx.userId);
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
