import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../server/middleware/auth';
import { handleError } from '../../../../../server/middleware/error-handler';
import { decideLeaveRequest } from '../../../../../server/services/leave.service';
import { z } from 'zod';
import { UnauthorizedError } from '../../../../../server/types/errors';

const DecideLeaveRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;

    // Standard authorization check (could be refined to direct manager check)
    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    if (!isAdminOrHR) {
      throw new UnauthorizedError('Only managers can decide leave requests');
    }

    if (!ctx.employeeId) {
      throw new Error('Approver must be an employee');
    }

    const body = await req.json();
    const { decision } = DecideLeaveRequestSchema.parse(body);

    const updated = await decideLeaveRequest(id, decision, ctx.employeeId, ctx.userId);

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
