import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../server/middleware/auth';
import { handleError } from '../../../server/middleware/error-handler';
import { db } from '../../../server/db/client';
import { designations } from '../../../server/db/schema/hr';

export async function GET(req: NextRequest) {
  try {
    await withAuth(req);
    const data = await db.select().from(designations);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest) {
  try {
    const session = await withAuth(req);
    // Add role check if needed, typically handled by middleware or explicit check
    
    const body = await req.json();
    const { id, annualLeaveDays } = body;
    
    if (!id || !annualLeaveDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [updated] = await db.update(designations)
      .set({ annualLeaveDays: annualLeaveDays.toString() })
      .where(eq(designations.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
