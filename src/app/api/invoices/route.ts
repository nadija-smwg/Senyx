import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listInvoices, createInvoice } from '@/server/services/finance.service';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    // Project Owners might only see their own invoices in a real app,
    // but for now we list all (or depend on params).
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
    // In a real app, only Finance/Admin can create manual invoices
    const body = await req.json();
    const invoice = await createInvoice(body, ctx.userId);
    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
