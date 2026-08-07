import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../server/middleware/auth';
import { handleError } from '../../../server/middleware/error-handler';
import { getLeaveBalances } from '../../../server/services/leave.service';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    
    if (!ctx.employeeId) {
      throw new Error('User does not have an associated employee profile');
    }
    
    const balances = await getLeaveBalances(ctx.employeeId);

    return NextResponse.json({ data: balances });
  } catch (error) {
    return handleError(error);
  }
}
