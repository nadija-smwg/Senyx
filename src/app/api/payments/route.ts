import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listPayments, recordPayment } from '@/server/services/payment.service';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const payments = await listPayments();
    return NextResponse.json({ data: payments });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const payment = await recordPayment(body, ctx.userId);
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
