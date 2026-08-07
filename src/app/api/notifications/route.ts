import { NextResponse } from 'next/server';
import { listNotifications, getUnreadCount } from '@/server/services/notification.service';
import { withAuth } from '@/server/middleware/auth';

export async function GET(req: Request) {
  try {
    const ctx = await withAuth(req as any);
    const url = new URL(req.url);
    const isReadParam = url.searchParams.get('isRead');
    
    const params: any = {};
    if (isReadParam === 'true') params.isRead = true;
    if (isReadParam === 'false') params.isRead = false;
    
    const limit = url.searchParams.get('limit');
    if (limit) params.limit = limit;
    
    const offset = url.searchParams.get('offset');
    if (offset) params.offset = offset;
    
    const type = url.searchParams.get('type');
    if (type && type !== 'all') params.type = type;
    
    const startDate = url.searchParams.get('startDate');
    if (startDate) params.startDate = startDate;
    
    const endDate = url.searchParams.get('endDate');
    if (endDate) params.endDate = endDate;

    const { items: notifications, total } = await listNotifications(ctx.userId, params);
    const unreadCount = await getUnreadCount(ctx.userId);

    return NextResponse.json({ notifications, total, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 500 });
  }
}
