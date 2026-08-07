import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { updateTask } from '@/server/services/task.service';
import { db } from '@/server/db/client';
import { tasks } from '@/server/db/schema/projects';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
  estimateHours: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await updateTask((await params).id, validatedData, ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const taskId = (await params).id;
    await db.update(tasks).set({
      deletedAt: new Date(),
      updatedBy: ctx.userId,
    }).where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
