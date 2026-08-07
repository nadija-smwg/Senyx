import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getSummary } from '@/server/services/project.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(req);
    const data = await getSummary((await params).id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
