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
  startDate: z.string(),
  salary: z.string().optional(),
  bankDetails: z.any().optional(),
  nationalId: z.string().optional(),
  // Auth account fields
  initialPassword: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().uuid().optional(), // If omitted, defaults to "Employee" role
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    // Admin and HR Managers see all employees; everyone else sees only their own
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

    // Only Admins and HR Managers can create employees
    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    if (!isAdminOrHR) {
      throw new UnauthorizedError('Only administrators can add employees.');
    }

    const body = await req.json();
    const validatedData = CreateEmployeeSchema.parse(body);

    const newEmployee = await createEmployee(validatedData, ctx.userId);

    return NextResponse.json(
      {
        data: newEmployee,
        message: 'Employee created successfully. Login access has been created.',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
