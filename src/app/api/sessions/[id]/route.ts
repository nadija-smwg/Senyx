import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { sessions } from '@/server/db/schema/identity';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { handleError } from '@/server/middleware/error-handler';
import { withAudit } from '@/server/lib/with-audit';
import { eq } from 'drizzle-orm';

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'edit')(ctx);
    const { id } = await props.params;

    await withAudit(ctx, 'session.terminate', 'session', id, async (tx) => {
      const endedAt = new Date();
      await tx.update(sessions)
        .set({ endedAt, isActive: false })
        .where(eq(sessions.id, id));
      return { result: true };
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
