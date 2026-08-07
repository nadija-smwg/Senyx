import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { closeDeal } from '@/server/services/deal.service';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['won', 'lost']),
  reason: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const { status, reason } = schema.parse(body);
    
    const updatedRecord = await closeDeal((await params).id, status, reason, ctx.userId);
    return NextResponse.json({ data: updatedRecord });
  } catch (error) {
    return handleError(error);
  }
}
