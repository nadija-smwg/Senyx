import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listQuotes, createQuote } from '@/server/services/deal.service';
import { z } from 'zod';

const schema = z.object({
  dealId: z.string().uuid(),
  amount: z.string().or(z.number()),
  currency: z.string().max(3).optional(),
  validUntil: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await withAuth(req);
    const searchParams = req.nextUrl.searchParams;
    const dealId = searchParams.get('dealId') || undefined;
    
    const data = await listQuotes(dealId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const newRecord = await createQuote(validatedData, ctx.userId);
    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
