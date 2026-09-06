import { NextRequest, NextResponse } from 'next/server';
import { withAuth, enforcePasswordChanged } from '../../../../../server/middleware/auth';
import { handleError } from '../../../../../server/middleware/error-handler';
import { resetEmployeePassword } from '../../../../../server/services/employee.service';
import { UnauthorizedError } from '../../../../../server/types/errors';

/**
 * POST /api/employees/:id/reset-password
 * Generates a new temporary password for the employee.
 * Requires Admin or HR Manager role.
 * Returns the temporary password to be shown once to the admin.
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
      throw new UnauthorizedError('Only administrators can reset employee passwords.');
    }

    const result = await resetEmployeePassword(id, ctx.userId);

    return NextResponse.json({
      message: 'Password has been reset. Share the temporary password securely with the employee.',
      tempPassword: result.tempPassword,
      employeeName: result.employeeName,
      email: result.email,
    });
  } catch (error) {
    return handleError(error);
  }
}
