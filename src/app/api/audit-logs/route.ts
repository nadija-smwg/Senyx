import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { db } from '@/server/db/client';
import { auditLogs } from '@/server/db/schema/platform';
import { desc, eq, and, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    if (!ctx.roles.includes('admin') && !ctx.roles.includes('owner')) {
      throw new Error('Unauthorized');
    }

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const user = req.nextUrl.searchParams.get('user');
    const module = req.nextUrl.searchParams.get('module');
    const action = req.nextUrl.searchParams.get('action');

    let conditions = [];
    if (user) conditions.push(eq(auditLogs.actorId, user));
    if (module) conditions.push(eq(auditLogs.entityType, module));
    if (action) conditions.push(eq(auditLogs.action, action));

    const data = await db.select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({ data, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
