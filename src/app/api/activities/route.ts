import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listActivities, createActivity } from '@/server/services/crm.service';
import { z } from 'zod';

const schema = z.object({
  subject: z.string().min(1).max(160),
  type: z.string().max(20).optional(),
  dueDate: z.string().optional(), // ISO
  assigneeId: z.string().uuid().optional(),
  relatedType: z.string().max(30).optional(),
  relatedId: z.string().uuid().optional(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await withAuth(req);
    const searchParams = req.nextUrl.searchParams;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const status = searchParams.get('status') || undefined;
    
    const data = await listActivities(assigneeId, status);
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
    const newRecord = await createActivity(validatedData, ctx.userId);
    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
