import { NextRequest, NextResponse } from 'next/server';
import { withAuth, enforcePasswordChanged } from '../../../server/middleware/auth';
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
  // No password field — generated server-side
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

    const result = await createEmployee(validatedData, ctx.userId);

    // Return employee data + tempPassword (shown once to admin)
    return NextResponse.json(
      {
        data: {
          id: result.id,
          employeeCode: result.employeeCode,
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
        },
        tempPassword: result.tempPassword,
        message: 'Employee created successfully. Login access has been created.',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
