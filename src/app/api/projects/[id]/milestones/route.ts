import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listMilestones, createMilestone } from '@/server/services/milestone.service';
import { enforceProjectAccess, requireAdmin } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    await enforceProjectAccess(ctx, id);
    const data = await listMilestones(id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    requireAdmin(ctx);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await createMilestone(id, validatedData, ctx.userId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
