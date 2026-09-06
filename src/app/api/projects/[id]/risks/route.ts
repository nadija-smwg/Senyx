import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listRisks, createRisk } from '@/server/services/assignment.service';
import { enforceProjectAccess, requireAdmin } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().optional().nullable(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'mitigating', 'closed']).optional(),
  ownerId: z.string().uuid().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    await enforceProjectAccess(ctx, id);
    const data = await listRisks(id);
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
    const data = await createRisk(id, validatedData, ctx.userId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
