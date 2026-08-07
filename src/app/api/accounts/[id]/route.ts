import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getAccount, updateAccount, deleteAccount } from '@/server/services/crm.service';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  industry: z.string().max(60).optional(),
  size: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.any().optional(),
  status: z.enum(['prospect', 'active', 'inactive']).optional(),
  ownerId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(req);
    const data = await getAccount((await params).id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const updatedRecord = await updateAccount((await params).id, validatedData, ctx.userId);
    return NextResponse.json({ data: updatedRecord });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    await deleteAccount((await params).id, ctx.userId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleError(error);
  }
}
