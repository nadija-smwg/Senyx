import { NextResponse } from 'next/server';
import { markAsRead } from '@/server/services/notification.service';
import { withAuth } from '@/server/middleware/auth';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const ctx = await withAuth(req as any);
    await markAsRead(params.id, ctx.userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 500 });
  }
}
