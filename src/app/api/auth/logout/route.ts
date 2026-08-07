import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../server/services/auth.service';
import { withAuth } from '../../../../server/middleware/auth';
import { handleError } from '../../../../server/middleware/error-handler';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const cookieStore = await cookies();
    
    await authService.logout(ctx, cookieStore);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
