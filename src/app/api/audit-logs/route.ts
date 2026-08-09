import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { db } from '@/server/db/client';
import { auditLogs } from '@/server/db/schema/platform';
import { desc, eq, and, or, gte, lte, ilike, gt, lt } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    const roles = ctx.roles.map(r => r.toLowerCase());
    if (!roles.includes('admin') && !roles.includes('owner')) {
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

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    const roles = ctx.roles.map(r => r.toLowerCase());
    if (!roles.includes('admin') && !roles.includes('owner')) {
      throw new Error('Unauthorized');
    }

    const { filterGroup, page = 1, limit = 50 } = await req.json();

    let ruleConditions = [];
    if (filterGroup && filterGroup.rules && filterGroup.rules.length > 0) {
      for (const rule of filterGroup.rules) {
        if (!rule.value) continue;
        
        let col: any;
        switch (rule.field) {
          case 'action': col = auditLogs.action; break;
          case 'entityType': col = auditLogs.entityType; break;
          case 'actorId': col = auditLogs.actorId; break;
          case 'status': col = auditLogs.result; break;
          case 'timestamp': col = auditLogs.createdAt; break;
        }

        if (col) {
          switch (rule.operator) {
            case 'equals': ruleConditions.push(eq(col, rule.value)); break;
            case 'contains': ruleConditions.push(ilike(col, `%${rule.value}%`)); break;
            case 'after': ruleConditions.push(gt(col, new Date(rule.value))); break;
            case 'before': ruleConditions.push(lt(col, new Date(rule.value))); break;
          }
        }
      }
    }

    let finalCondition = undefined;
    if (ruleConditions.length > 0) {
      finalCondition = filterGroup.logic === 'OR' ? or(...ruleConditions) : and(...ruleConditions);
    }

    const data = await db.select()
      .from(auditLogs)
      .where(finalCondition)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({ data, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
