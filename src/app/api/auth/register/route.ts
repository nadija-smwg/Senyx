import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '../../../../server/services/auth.service';
import { validateBody } from '../../../../server/middleware/validate';
import { handleError } from '../../../../server/middleware/error-handler';
import { parseUserAgent } from '../../../../server/lib/user-agent-parser';
import { cookies } from 'next/headers';

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(registerSchema, req);
    const uaString = req.headers.get('user-agent');
    const deviceInfo = parseUserAgent(uaString);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'Unknown';
    const cookieStore = await cookies();

    const result = await authService.register(body, cookieStore);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration API Error:', error);
    return handleError(error);
  }
}
