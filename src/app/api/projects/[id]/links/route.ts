import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { db } from '@/server/db/client';
import { projectLinks } from '@/server/db/schema/projects';
import { eq, asc } from 'drizzle-orm';
import { enforceProjectAccess, requireAdmin } from '@/server/middleware/project-access';
import { z } from 'zod';

const CreateLinkSchema = z.object({
  name: z.string().min(1, 'Link name is required').max(80),
  url: z.string().url('Please enter a valid URL'),
  description: z.string().max(500).optional(),
});

// GET /api/projects/[id]/links — list all links for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    await enforceProjectAccess(ctx, id);

    const links = await db
      .select()
      .from(projectLinks)
      .where(eq(projectLinks.projectId, id))
      .orderBy(asc(projectLinks.position), asc(projectLinks.createdAt));

    return NextResponse.json({ data: links });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/projects/[id]/links — create a new link (admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    requireAdmin(ctx);

    const body = await req.json();
    const validated = CreateLinkSchema.parse(body);

    const existing = await db
      .select({ position: projectLinks.position })
      .from(projectLinks)
      .where(eq(projectLinks.projectId, id))
      .orderBy(asc(projectLinks.position));

    const nextPosition = existing.length > 0
      ? ((existing[existing.length - 1]?.position ?? 0) + 1)
      : 0;

    const [newLink] = await db.insert(projectLinks).values({
      projectId: id,
      name: validated.name,
      url: validated.url,
      description: validated.description ?? null,
      position: nextPosition,
    }).returning();

    return NextResponse.json({ data: newLink }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
