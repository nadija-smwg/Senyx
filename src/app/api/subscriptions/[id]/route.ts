import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { updateSubscription } from '@/server/services/subscription.service';
import { db } from '@/server/db/client';
import { subscriptions } from '@/server/db/schema/finance';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const id = (await params).id;
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: subscription });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await withAuth(req);
    const id = (await params).id;
    const body = await req.json();
    const updated = await updateSubscription(id, body, ctx.userId);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
