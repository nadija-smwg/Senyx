import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/server/middleware/auth';
import { validateBody } from '@/server/middleware/validate';
import { handleError } from '@/server/middleware/error-handler';
import { withAudit } from '@/server/lib/with-audit';

const verify2FASchema = z.object({
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await validateBody(verify2FASchema, req);

    await withAudit(ctx, 'auth.2fa_verify', 'user', ctx.userId, async (tx) => {
      // Placeholder: real TOTP verification via authenticator app goes here
      if (body.code !== '000000') { /* replace with real TOTP check */ }
      return { result: true };
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    return handleError(error);
  }
}
