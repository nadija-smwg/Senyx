import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../server/middleware/auth';
import { handleError } from '../../../../../server/middleware/error-handler';
import { activateEmployee } from '../../../../../server/services/employee.service';
import { UnauthorizedError } from '../../../../../server/types/errors';

/**
 * POST /api/employees/:id/activate
 * Re-activates a suspended employee and restores their login access.
 * Requires Admin or HR Manager role.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;

    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    if (!isAdminOrHR) {
      throw new UnauthorizedError('Only administrators can activate employees.');
    }

    await activateEmployee(id, ctx.userId);

    return NextResponse.json({ message: 'Employee activated successfully. Login access restored.' });
  } catch (error) {
    return handleError(error);
  }
}
