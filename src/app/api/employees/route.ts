import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../server/middleware/auth';
import { handleError } from '../../../server/middleware/error-handler';
import { listEmployees, createEmployee } from '../../../server/services/employee.service';
import { z } from 'zod';
import { UnauthorizedError } from '../../../server/types/errors';

const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  designationId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  startDate: z.string(), // YYYY-MM-DD
  salary: z.string().optional(), // Expected as plain text numeric string, to be encrypted
  bankDetails: z.any().optional(), // Expected as object, to be encrypted
  nationalId: z.string().optional(), // Expected as plain text string, to be encrypted
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    // Check if user has HR/Admin role to see all records unmasked
    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    const scope = isAdminOrHR ? 'all' : 'own';
    
    const employees = await listEmployees(scope, ctx.userId, ctx.employeeId);

    return NextResponse.json({ data: employees });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    if (!isAdminOrHR) {
      throw new UnauthorizedError('Only HR Managers and Admins can create employees');
    }

    const body = await req.json();
    const validatedData = CreateEmployeeSchema.parse(body);
    
    const newEmployee = await createEmployee(validatedData, ctx.userId);

    return NextResponse.json({ data: newEmployee }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
