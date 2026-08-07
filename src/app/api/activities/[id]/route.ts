import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { updateActivity } from '@/server/services/crm.service';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
  subject: z.string().optional(),
  type: z.string().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    
    const updatedRecord = await updateActivity((await params).id, validatedData, ctx.userId);
    return NextResponse.json({ data: updatedRecord });
  } catch (error) {
    return handleError(error);
  }
}
