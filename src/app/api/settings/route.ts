import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { settings } from '@/server/db/schema/platform';
import { withAuth } from '@/server/middleware/auth';
import { requirePermission } from '@/server/middleware/rbac';
import { validateBody } from '@/server/middleware/validate';
import { handleError } from '@/server/middleware/error-handler';
import { withAudit } from '@/server/lib/with-audit';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'view')(ctx);
    const allSettings = await db.select().from(settings);
    return NextResponse.json({ data: allSettings });
  } catch (error) {
    return handleError(error);
  }
}

const updateSettingsSchema = z.record(z.string(), z.any());

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    requirePermission('settings', 'edit')(ctx);
    const body = await validateBody(updateSettingsSchema, req);

    await withAudit(ctx, 'settings.update_bulk', 'settings', null, async (tx) => {
      const beforeState = await tx.select().from(settings);
      for (const [key, value] of Object.entries(body)) {
        await tx.insert(settings)
          .values({ key, value: JSON.stringify(value) })
          .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value), updatedAt: new Date() } });
      }
      return { result: true, before: beforeState, after: body };
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
