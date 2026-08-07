import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listDeals, createDeal } from '@/server/services/deal.service';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(140),
  accountId: z.string().uuid(),
  ownerId: z.string().uuid().optional(),
  amount: z.string().or(z.number()),
  currency: z.string().max(3).optional(),
  expectedCloseDate: z.string().optional(),
  source: z.string().max(40).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const isAdminOrSalesLead = ctx.roles.includes('Admin') || ctx.roles.includes('Sales Lead');
    const scope = isAdminOrSalesLead ? 'all' : 'own';
    
    const data = await listDeals(scope, ctx.employeeId || '');
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
    const newRecord = await createDeal(validatedData, ctx.userId, ctx.employeeId || '');
    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
