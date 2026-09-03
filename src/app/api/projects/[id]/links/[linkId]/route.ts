import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { db } from '@/server/db/client';
import { projectLinks } from '@/server/db/schema/projects';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { NotFoundError } from '@/server/types/errors';

const UpdateLinkSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  url: z.string().url('Please enter a valid URL').optional(),
  description: z.string().max(500).nullable().optional(),
});

// PATCH /api/projects/[id]/links/[linkId] — update a link
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    await withAuth(req);
    const { id, linkId } = await params;

    const body = await req.json();
    const validated = UpdateLinkSchema.parse(body);

    const [existing] = await db
      .select()
      .from(projectLinks)
      .where(and(eq(projectLinks.id, linkId), eq(projectLinks.projectId, id)));

    if (!existing) throw new NotFoundError('Link not found');

    const [updated] = await db
      .update(projectLinks)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(projectLinks.id, linkId))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/projects/[id]/links/[linkId] — delete a link
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    await withAuth(req);
    const { id, linkId } = await params;

    const [existing] = await db
      .select()
      .from(projectLinks)
      .where(and(eq(projectLinks.id, linkId), eq(projectLinks.projectId, id)));

    if (!existing) throw new NotFoundError('Link not found');

    await db.delete(projectLinks).where(eq(projectLinks.id, linkId));

    return NextResponse.json({ message: 'Link deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
