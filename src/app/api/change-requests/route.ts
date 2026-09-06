import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../server/middleware/auth';
import { handleError } from '../../../server/middleware/error-handler';
import { listChangeRequests, createChangeRequest } from '../../../server/services/change-request.service';
import { z } from 'zod';
import { UnauthorizedError } from '../../../server/types/errors';

const CreateChangeRequestSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    // Admins see all requests, employees see only their own
    const isAdmin = ctx.roles.includes('Admin');
    const employeeIdFilter = isAdmin ? undefined : ctx.employeeId;

    if (!isAdmin && !employeeIdFilter) {
        throw new UnauthorizedError('Employee context not found.');
    }
    
    const requests = await listChangeRequests(employeeIdFilter);

    return NextResponse.json({ data: requests });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);

    if (!ctx.employeeId) {
      throw new UnauthorizedError('Only employees can submit change requests.');
    }

    const body = await req.json();
    const validatedData = CreateChangeRequestSchema.parse(body);

    const result = await createChangeRequest({
      employeeId: ctx.employeeId,
      title: validatedData.title,
      description: validatedData.description,
    });

    return NextResponse.json(
      {
        data: result,
        message: 'Change request submitted successfully.',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
