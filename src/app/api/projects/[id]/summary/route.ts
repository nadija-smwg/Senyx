import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getSummary } from '@/server/services/project.service';
import { enforceProjectAccess, isAdminUser } from '@/server/middleware/project-access';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    await enforceProjectAccess(ctx, id);

    const data = await getSummary(id);

    // Strip financial summary data from non-admins
    if (!isAdminUser(ctx)) {
      const { financials, ...safeData } = data as any;
      return NextResponse.json({ data: safeData });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
