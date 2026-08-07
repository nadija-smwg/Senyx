import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { updateInvoice } from '@/server/services/finance.service';
import { db } from '@/server/db/client';
import { invoices, invoiceLineItems } from '@/server/db/schema/finance';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const id = (await params).id;
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const lines = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));
    return NextResponse.json({ data: { ...invoice, lineItems: lines } });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const id = (await params).id;
    const body = await req.json();
    const updated = await updateInvoice(id, body, ctx.userId);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
