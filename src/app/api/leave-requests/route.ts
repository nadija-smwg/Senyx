import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../server/middleware/auth';
import { handleError } from '../../../server/middleware/error-handler';
import { listLeaveRequests, createLeaveRequest } from '../../../server/services/leave.service';
import { z } from 'zod';

const CreateLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string(), // ISO date
  endDate: z.string(), // ISO date
  days: z.string(),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    const scope = isAdminOrHR ? 'all' : 'own';
    
    const requests = await listLeaveRequests(scope, ctx.employeeId!);

    return NextResponse.json({ data: requests });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = CreateLeaveRequestSchema.parse(body);
    
    if (!ctx.employeeId) {
      throw new Error('User does not have an associated employee profile');
    }

    const request = await createLeaveRequest({
      employeeId: ctx.employeeId,
      leaveTypeId: validatedData.leaveTypeId,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      days: validatedData.days,
      reason: validatedData.reason,
    }, ctx.userId);

    return NextResponse.json({ data: request }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
