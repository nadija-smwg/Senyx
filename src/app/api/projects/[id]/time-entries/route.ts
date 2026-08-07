import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listTimeEntries, logTime } from '@/server/services/time.service';
import { z } from 'zod';

const schema = z.object({
  taskId: z.string().uuid().optional().nullable(),
  workDate: z.string(), // YYYY-MM-DD format usually
  hours: z.number().min(0.01).max(24),
  description: z.string().optional(),
  billable: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(req);
    const data = await listTimeEntries((await params).id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await logTime((await params).id, validatedData, ctx.userId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
