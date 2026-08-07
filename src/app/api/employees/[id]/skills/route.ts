import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../server/middleware/auth';
import { handleError } from '../../../../../server/middleware/error-handler';
import { addEmployeeSkill } from '../../../../../server/services/employee.service';
import { z } from 'zod';
import { UnauthorizedError } from '../../../../../server/types/errors';

const AddSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.number().int().min(1).max(5),
  certified: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;

    // Only HR, Admin, or the employee themselves can add a skill
    const isAdminOrHR = ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
    if (!isAdminOrHR && ctx.employeeId !== id) {
      throw new UnauthorizedError('You can only add skills to your own profile');
    }

    const body = await req.json();
    const validatedData = AddSkillSchema.parse(body);

    await addEmployeeSkill(id, validatedData.skillId, validatedData.proficiency, validatedData.certified, ctx.userId);

    return NextResponse.json({ message: 'Skill added successfully' }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
