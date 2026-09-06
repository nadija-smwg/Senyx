import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { unassign } from '@/server/services/assignment.service';
import { requireAdmin } from '@/server/middleware/project-access';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const ctx = await withAuth(req);
    // Only admins can remove team members from projects
    requireAdmin(ctx);
    const { assignmentId } = await params;
    await unassign(assignmentId, ctx.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
