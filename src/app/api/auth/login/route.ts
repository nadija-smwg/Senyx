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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Logs in a user using email and password, setting a session cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid input or credentials
 */
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
