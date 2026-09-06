import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getBoard } from '@/server/services/project.service';
import { enforceProjectAccess } from '@/server/middleware/project-access';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const { id } = await params;
    await enforceProjectAccess(ctx, id);
    const data = await getBoard(id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
