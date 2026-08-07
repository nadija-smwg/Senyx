import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../server/middleware/auth';
import { handleError } from '../../../server/middleware/error-handler';
import { db } from '../../../server/db/client';
import { skills } from '../../../server/db/schema/hr';

export async function GET(req: NextRequest) {
  try {
    await withAuth(req);
    const data = await db.select().from(skills);
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
