import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { changeDealStage } from '@/server/services/deal.service';
import { z } from 'zod';

const schema = z.object({
  newStage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const { newStage } = schema.parse(body);
    
    // In a real scenario, we'd check if the user is the owner or an admin
    const updatedRecord = await changeDealStage((await params).id, newStage, ctx.userId);
    return NextResponse.json({ data: updatedRecord });
  } catch (error) {
    return handleError(error);
  }
}
