import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { db } from '@/server/db/client';
import { boardColumns } from '@/server/db/schema/projects';
import { eq, and, isNull, max } from 'drizzle-orm';
import { enforceProjectAccess, requireAdmin } from '@/server/middleware/project-access';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(40),
  wipLimit: z.number().int().min(0).optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const projectId = (await params).id;
    // Only admins can add board columns
    requireAdmin(ctx);

    const body = await req.json();
    const { name, wipLimit } = schema.parse(body);

    // Get next position
    const [result] = await db
      .select({ maxPos: max(boardColumns.position) })
      .from(boardColumns)
      .where(and(eq(boardColumns.projectId, projectId), isNull(boardColumns.deletedAt)));

    const nextPosition = (result?.maxPos ?? -1) + 1;

    const [column] = await db.insert(boardColumns).values({
      projectId,
      name,
      position: nextPosition,
      wipLimit: wipLimit ?? null,
      createdBy: ctx.userId,
    }).returning();

    return NextResponse.json({ data: column }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
