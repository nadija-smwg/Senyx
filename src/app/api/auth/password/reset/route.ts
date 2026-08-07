import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateBody } from '@/server/middleware/validate';
import { handleError } from '@/server/middleware/error-handler';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const resetSchema = z.object({
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(resetSchema, req);
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          }
        }
      }
    );

    const { error } = await supabase.auth.updateUser({ password: body.password });
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
