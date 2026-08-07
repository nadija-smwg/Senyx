import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '@/server/services/rbac.service';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { validateBody } from '@/server/middleware/validate';
import { handleError } from '@/server/middleware/error-handler';
import { z } from 'zod';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'view')(ctx);
    const { id } = await props.params;
    const role = await rbacService.getRole(id);
    return NextResponse.json({ data: role });
  } catch (error) {
    return handleError(error);
  }
}

const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().optional(),
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'edit')(ctx);
    const { id } = await props.params;
    const body = await validateBody(updateRoleSchema, req);
    const updated = await rbacService.updateRole(ctx, id, body);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'delete')(ctx);
    const { id } = await props.params;
    await rbacService.deleteRole(ctx, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
