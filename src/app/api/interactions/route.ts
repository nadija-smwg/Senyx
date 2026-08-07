import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listInteractions, createInteraction } from '@/server/services/crm.service';
import { z } from 'zod';

const schema = z.object({
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  type: z.enum(['call', 'email', 'meeting', 'note']),
  subject: z.string().min(1).max(160),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await withAuth(req);
    const searchParams = req.nextUrl.searchParams;
    const accountId = searchParams.get('accountId') || undefined;
    const contactId = searchParams.get('contactId') || undefined;
    
    const data = await listInteractions(accountId, contactId);
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
    const newRecord = await createInteraction(validatedData, ctx.userId);
    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
