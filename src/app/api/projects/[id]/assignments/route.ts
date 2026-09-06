import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listAssignments, assign } from '@/server/services/assignment.service';
import { enforceProjectAccess, requireAdmin } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  employeeId: z.string().uuid(),
  roleOnProject: z.string().optional().nullable(),
  allocationPct: z.number().min(0).max(100).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    await enforceProjectAccess(ctx, id);
    const data = await listAssignments(id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    // Only admins can assign members to projects
    requireAdmin(ctx);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await assign(id, validatedData, ctx.userId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
