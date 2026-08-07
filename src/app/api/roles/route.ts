import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '@/server/services/rbac.service';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { validateBody } from '@/server/middleware/validate';
import { handleError } from '@/server/middleware/error-handler';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'view')(ctx);
    const allRoles = await rbacService.listRoles();
    return NextResponse.json({ data: allRoles });
  } catch (error) {
    return handleError(error);
  }
}

const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'create')(ctx);
    const body = await validateBody(createRoleSchema, req);
    const newRole = await rbacService.createRole(ctx, body);
    return NextResponse.json({ data: newRole }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
