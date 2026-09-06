import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../server/middleware/auth';
import { handleError } from '../../../../server/middleware/error-handler';
import { getChangeRequest, updateChangeRequestStatus } from '../../../../server/services/change-request.service';
import { z } from 'zod';
import { UnauthorizedError } from '../../../../server/types/errors';

const UpdateChangeRequestSchema = z.object({
  status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']),
  adminComment: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const resolvedParams = await params;
    
    // Admins can see any request, employees can only see their own
    const isAdmin = ctx.roles.includes('Admin');
    const employeeIdFilter = isAdmin ? undefined : ctx.employeeId;

    if (!isAdmin && !employeeIdFilter) {
      throw new UnauthorizedError('Employee context not found.');
    }
    
    const request = await getChangeRequest(resolvedParams.id, employeeIdFilter);

    return NextResponse.json({ data: request });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const resolvedParams = await params;

    // Only admins can update change requests (status and comments)
    if (!ctx.roles.includes('Admin')) {
      throw new UnauthorizedError('Only administrators can update change requests.');
    }

    const body = await req.json();
    const validatedData = UpdateChangeRequestSchema.parse(body);

    const result = await updateChangeRequestStatus(ctx, resolvedParams.id, {
      status: validatedData.status,
      adminComment: validatedData.adminComment,
      reviewedBy: ctx.userId,
    });

    return NextResponse.json(
      {
        data: result,
        message: 'Change request updated successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
