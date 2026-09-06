import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { updateRisk } from '@/server/services/assignment.service';
import { requireAdmin } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().optional().nullable(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'mitigating', 'closed']).optional(),
  ownerId: z.string().uuid().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; riskId: string }> }
) {
  try {
    const ctx = await withAuth(req);
    requireAdmin(ctx);
    const { riskId } = await params;
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await updateRisk(riskId, validatedData, ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
