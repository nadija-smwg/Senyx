import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getAccount, updateAccount, deleteAccount } from '@/server/services/crm.service';
import { ForbiddenError } from '@/server/types/errors';
import { z } from 'zod';

const CRM_WRITE_ROLES = ['Admin', 'Sales Lead', 'Project Owner', 'Finance'];
const CRM_READ_ROLES = [...CRM_WRITE_ROLES, 'Employee'];

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  industry: z.string().max(60).optional(),
  size: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.any().optional(),
  status: z.enum(['prospect', 'active', 'inactive']).optional(),
  ownerId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const canView = ctx.roles.some((r) => CRM_READ_ROLES.includes(r));
    if (!canView) {
      throw new ForbiddenError('You do not have permission to view this account.');
    }
    const data = await getAccount((await params).id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const canEdit = ctx.roles.some((r) => CRM_WRITE_ROLES.includes(r));
    if (!canEdit) {
      throw new ForbiddenError('You do not have permission to edit accounts.');
    }
    const body = await req.json();
    const validatedData = schema.parse(body);
    const updatedRecord = await updateAccount((await params).id, validatedData, ctx.userId);
    return NextResponse.json({ data: updatedRecord });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const canDelete = ctx.roles.some((r) => CRM_WRITE_ROLES.includes(r));
    if (!canDelete) {
      throw new ForbiddenError('You do not have permission to delete accounts.');
    }
    await deleteAccount((await params).id, ctx.userId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleError(error);
  }
}
