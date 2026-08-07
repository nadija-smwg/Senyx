import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listSubscriptions, createSubscription } from '@/server/services/subscription.service';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const subscriptions = await listSubscriptions();
    return NextResponse.json({ data: subscriptions });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const subscription = await createSubscription(body, ctx.userId);
    return NextResponse.json({ data: subscription }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
