import { NextResponse } from 'next/server';
import { markAllAsRead } from '@/server/services/notification.service';
import { withAuth } from '@/server/middleware/auth';

export async function POST(req: Request) {
  try {
    const ctx = await withAuth(req as any);
    await markAllAsRead(ctx.userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 500 });
  }
}
