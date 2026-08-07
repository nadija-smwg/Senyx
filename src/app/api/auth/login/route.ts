import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '../../../../server/services/auth.service';
import { validateBody } from '../../../../server/middleware/validate';
import { handleError } from '../../../../server/middleware/error-handler';
import { parseUserAgent } from '../../../../server/lib/user-agent-parser';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(loginSchema, req);
    const uaString = req.headers.get('user-agent');
    const deviceInfo = parseUserAgent(uaString);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'Unknown';
    const cookieStore = await cookies();

    const result = await authService.login(body.email, body.password, deviceInfo, ip, cookieStore);

    return NextResponse.json({
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return handleError(error);
  }
}
