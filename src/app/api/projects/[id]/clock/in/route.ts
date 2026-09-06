import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { clockIn } from '@/server/services/time.service';
import { enforceProjectAccess } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  taskId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    // Employees can clock into projects they are assigned to; admins can always clock in
    await enforceProjectAccess(ctx, id);

    let body = {};
    try { body = await req.json(); } catch (e) {}
    
    const { taskId } = schema.parse(body);
    const data = await clockIn(id, taskId, ctx.employeeId || '', ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
