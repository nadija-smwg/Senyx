import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listProjects, createProject } from '@/server/services/project.service';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(140),
  type: z.enum(['solution', 'product', 'internal']).optional(),
  accountId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  billingType: z.enum(['fixed', 'time_materials', 'retainer']).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  currency: z.string().max(3).optional(),
  companyName: z.string().max(140).optional().nullable(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, { message: "End date cannot be before start date", path: ["endDate"] });

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List projects
 *     description: Returns a list of projects based on user permissions and provided filters.
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [all, own, assigned]
 *         description: Scope of projects to retrieve
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: A list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const scope = (req.nextUrl.searchParams.get('scope') as 'all' | 'own' | 'assigned') || 'assigned';
    const data = await listProjects(scope, ctx.employeeId || null);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Creates a new project. User must have employee access.
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [solution, product, internal]
 *               status:
 *                 type: string
 *                 enum: [planning, active, on_hold, completed, cancelled]
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    if (!ctx.employeeId) throw new Error('You must be an employee to create projects');
    const data = await createProject(validatedData, ctx.userId, ctx.employeeId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
