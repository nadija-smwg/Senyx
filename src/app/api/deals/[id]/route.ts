import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { db } from '@/server/db/client';
import { deals } from '@/server/db/schema/sales';
import { eq, and, isNull } from 'drizzle-orm';
import { auditLogs } from '@/server/db/schema/platform';
import { z } from 'zod';

import { getDeal } from '@/server/services/deal.service';

const schema = z.object({
  name: z.string().min(1).max(140).optional(),
  amount: z.string().or(z.number()).optional(),
  currency: z.string().max(3).optional(),
  expectedCloseDate: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(req);
    const deal = await getDeal((await params).id);
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: deal });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const validatedData = schema.parse(body);
    
    const [updatedRecord] = await db.update(deals).set({
      ...validatedData,
      amount: validatedData.amount?.toString(),
      expectedCloseDate: validatedData.expectedCloseDate || undefined,
      updatedAt: new Date(),
      updatedBy: ctx.userId,
    }).where(and(eq(deals.id, (await params).id), isNull(deals.deletedAt))).returning();
    
    if (!updatedRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.insert(auditLogs).values({
      actorId: ctx.userId,
      action: 'deal.update',
      apiRoute: `/api/deals/${(await params).id}`,
      entityType: 'sales',
      entityId: (await params).id,
      result: 'success',
      after: validatedData,
      ipAddress: ctx.ip || '127.0.0.1',
    });

    return NextResponse.json({ data: updatedRecord });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    await db.update(deals).set({
      deletedAt: new Date(),
      updatedBy: ctx.userId,
    }).where(eq(deals.id, (await params).id));

    await db.insert(auditLogs).values({
      actorId: ctx.userId,
      action: 'deal.delete',
      apiRoute: `/api/deals/${(await params).id}`,
      entityType: 'sales',
      entityId: (await params).id,
      result: 'success',
      ipAddress: ctx.ip || '127.0.0.1',
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleError(error);
  }
}
