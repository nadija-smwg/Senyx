import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/register
 *
 * Public self-registration is disabled.
 * Employee accounts are created exclusively by Administrators
 * via HR & People → Employees → Add Employee.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: {
        code: 'REGISTRATION_DISABLED',
        message:
          'Public account registration is disabled. Employee accounts are created by your administrator.',
      },
    },
    { status: 403 }
  );
}
