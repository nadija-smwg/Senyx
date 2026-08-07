import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getProjectById, updateProject, deleteProject } from '@/server/services/project.service';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(140).optional(),
  type: z.enum(['solution', 'product']).optional(),
  accountId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid().optional(),
  billingType: z.enum(['fixed', 'time_materials', 'retainer']).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  currency: z.string().max(3).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(req);
    const data = await getProjectById((await params).id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await updateProject((await params).id, validatedData, ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    await deleteProject((await params).id, ctx.userId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleError(error);
  }
}
