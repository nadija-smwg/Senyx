import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { listContacts, createContact } from '@/server/services/crm.service';
import { ForbiddenError } from '@/server/types/errors';
import { z } from 'zod';

const CRM_ROLES = ['Admin', 'Sales Lead', 'Project Owner', 'Finance'];

const schema = z.object({
  accountId: z.string().uuid(),
  firstName: z.string().min(1).max(60),
  lastName: z.string().max(60).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  title: z.string().max(80).optional(),
  isPrimary: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);

    const canView = ctx.roles.some((r) => CRM_ROLES.includes(r));
    if (!canView) {
      throw new ForbiddenError('You do not have permission to view contacts.');
    }

    const searchParams = req.nextUrl.searchParams;
    const accountId = searchParams.get('accountId') || undefined;

    const data = await listContacts(accountId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);

    const canCreate = ctx.roles.some((r) => CRM_ROLES.includes(r));
    if (!canCreate) {
      throw new ForbiddenError('You do not have permission to create contacts.');
    }

    const body = await req.json();
    const validatedData = schema.parse(body);
    const newRecord = await createContact(validatedData, ctx.userId);
    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
