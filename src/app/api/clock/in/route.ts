import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { clockIn } from '@/server/services/time.service';
import { z } from 'zod';

const schema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const { projectId, taskId } = schema.parse(body);
    
    const data = await clockIn(projectId, taskId, ctx.employeeId || '', ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
