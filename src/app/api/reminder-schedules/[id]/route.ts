import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { reminderSchedules } from '@/server/db/schema/platform';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { validateBody } from '@/server/middleware/validate';
import { handleError } from '@/server/middleware/error-handler';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { withAudit } from '@/server/lib/with-audit';

const updateScheduleSchema = z.object({
  isActive: z.boolean().optional(),
  advanceDays: z.string().optional(),
  digestTime: z.string().optional(),
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const ctx = await withAuth(req);
    // requirePermission('settings', 'edit')(ctx);

    const body = await validateBody(updateScheduleSchema, req);

    await withAudit(ctx, 'reminder_schedule.update', 'platform', params.id, async (tx) => {
      const [before] = await tx.select().from(reminderSchedules).where(eq(reminderSchedules.id, params.id));
      if (!before) throw new Error('Schedule not found');

      const [after] = await tx.update(reminderSchedules)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(reminderSchedules.id, params.id))
        .returning();

      return { result: after, before, after };
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
