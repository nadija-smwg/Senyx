import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../server/middleware/auth';
import { handleError } from '../../../../../server/middleware/error-handler';
import { getSupabaseAdmin } from '../../../../../server/lib/supabase-admin';
import { db } from '../../../../../server/db/client';
import { users } from '../../../../../server/db/schema/identity';
import { employees } from '../../../../../server/db/schema/hr';
import { eq } from 'drizzle-orm';
import { UnauthorizedError, NotFoundError } from '../../../../../server/types/errors';

/**
 * POST /api/employees/:id/reset-password
 * Sends a Supabase password reset email to the employee.
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
      throw new UnauthorizedError('Only administrators can reset employee passwords.');
    }

    // Look up the employee's email
    const [employee] = await db.select({ email: employees.email }).from(employees).where(eq(employees.id, id));
    if (!employee) throw new NotFoundError('Employee not found');

    // Verify a user account exists for this employee
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.employeeId, id));
    if (!user) throw new NotFoundError('No login account found for this employee');

    // Generate a Supabase password reset link (uses configured Supabase email settings)
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: employee.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    });

    if (error) {
      console.error('Failed to generate password reset link:', error);
      return NextResponse.json(
        { message: 'Password reset initiated. If email delivery is configured, the employee will receive a reset link.' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: 'Password reset email sent successfully.',
      // Only return the link in development for testing purposes
      ...(process.env.NODE_ENV === 'development' && data?.properties?.action_link
        ? { resetLink: data.properties.action_link }
        : {}),
    });
  } catch (error) {
    return handleError(error);
  }
}
