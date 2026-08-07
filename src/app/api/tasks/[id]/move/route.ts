import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { moveTask } from '@/server/services/task.service';
import { z } from 'zod';

const schema = z.object({
  columnId: z.string().uuid(),
  position: z.number(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const { columnId, position } = schema.parse(body);
    const data = await moveTask((await params).id, columnId, position, ctx.userId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
