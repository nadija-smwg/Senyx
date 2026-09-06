import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { authService } from '@/server/services/auth.service';
import { z } from 'zod';

const ForceChangePasswordSchema = z.object({
  password: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * POST /api/auth/force-change-password
 * Used by employees who must change their temporary password on first login.
 * This endpoint is whitelisted in the auth middleware.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const { password } = ForceChangePasswordSchema.parse(body);

    const result = await authService.forceChangePassword(ctx, password);

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
