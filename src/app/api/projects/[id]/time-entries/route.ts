import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listTimeEntries, logTime } from '@/server/services/time.service';
import { enforceProjectAccess } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  taskId: z.string().uuid().optional().nullable(),
  workDate: z.string(),
  hours: z.number().min(0.01).max(24),
  description: z.string().optional(),
  billable: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    await enforceProjectAccess(ctx, id);
    const data = await listTimeEntries(id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    // Assigned employees can log time on their projects
    await enforceProjectAccess(ctx, id);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await logTime(id, validatedData, ctx.employeeId || '', ctx.userId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
