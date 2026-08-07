import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '@/server/services/rbac.service';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { handleError } from '@/server/middleware/error-handler';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'view')(ctx);

    const permissions = await rbacService.listPermissions();
    return NextResponse.json({ data: permissions });
  } catch (error) {
    return handleError(error);
  }
}
