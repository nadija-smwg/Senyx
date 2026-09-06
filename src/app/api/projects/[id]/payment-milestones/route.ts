import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listPaymentMilestones, createPaymentMilestone } from '@/server/services/milestone.service';
import { enforceProjectAccess, requireAdmin } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(80),
  phase: z.string().optional().nullable(),
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().min(0).optional(),
  expectedDate: z.string().optional().nullable(),
});

// Payment milestones are financial data — admin-only for both read and write
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    // Require admin for financial data
    requireAdmin(ctx);
    const data = await listPaymentMilestones(id);
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
    const data = await createPaymentMilestone(id, validatedData, ctx.userId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
