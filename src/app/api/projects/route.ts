import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listProjects, createProject } from '@/server/services/project.service';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(140),
  type: z.enum(['solution', 'product', 'internal']).optional(),
  accountId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  billingType: z.enum(['fixed', 'time_materials', 'retainer']).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  currency: z.string().max(3).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const scope = (req.nextUrl.searchParams.get('scope') as 'all' | 'own' | 'assigned') || 'assigned';
    const data = await listProjects(scope, ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    if (!ctx.employeeId) throw new Error('You must be an employee to create projects');
    const data = await createProject(validatedData, ctx.userId, ctx.employeeId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
