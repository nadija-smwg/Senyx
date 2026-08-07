import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../server/middleware/auth';
import { handleError } from '../../../../server/middleware/error-handler';
import { getEmployeeById, updateEmployee, deactivateEmployee } from '../../../../server/services/employee.service';
import { z } from 'zod';
import { UnauthorizedError } from '../../../../server/types/errors';

const UpdateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  phone: z.string().max(30).optional(),
  designationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated']).optional(),
  salary: z.string().optional(),
  bankDetails: z.any().optional(),
  nationalId: z.string().optional(),
  emergencyContact: z.any().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;

    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    const scope = isAdminOrHR ? 'all' : 'own';

    const employee = await getEmployeeById(id, scope, ctx.employeeId);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ data: employee });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;

    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    if (!isAdminOrHR) {
      throw new UnauthorizedError('Only HR Managers and Admins can update employees');
    }

    const body = await req.json();
    const validatedData = UpdateEmployeeSchema.parse(body);

    const updated = await updateEmployee(id, validatedData, ctx.userId);

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;

    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    if (!isAdminOrHR) {
      throw new UnauthorizedError('Only HR Managers and Admins can deactivate employees');
    }

    await deactivateEmployee(id, ctx.userId);

    return NextResponse.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    return handleError(error);
  }
}
