import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listTasks, createTask } from '@/server/services/task.service';
import { enforceProjectAccess } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  columnId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
  estimateHours: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    await enforceProjectAccess(ctx, id);
    const data = await listTasks(id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    // Assigned employees can create tasks on their projects
    await enforceProjectAccess(ctx, id);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await createTask(id, validatedData, ctx.userId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
