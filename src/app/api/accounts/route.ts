import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listAccounts, createAccount } from '@/server/services/crm.service';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(120),
  industry: z.string().max(60).optional(),
  size: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.any().optional(),
  status: z.enum(['prospect', 'active', 'inactive']).optional(),
  ownerId: z.string().uuid().optional().nullable().or(z.literal('')),
});

export async function GET(req: NextRequest) {
  try {
    await withAuth(req);
    const data = await listAccounts();
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    const newRecord = await createAccount(validatedData, ctx.userId);
    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
