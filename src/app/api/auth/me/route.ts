import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../server/services/auth.service';
import { withAuth } from '../../../../server/middleware/auth';
import { handleError } from '../../../../server/middleware/error-handler';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const result = await authService.getMe(ctx);

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
