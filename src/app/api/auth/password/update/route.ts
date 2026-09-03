import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getSupabaseAdmin } from '@/server/lib/supabase-admin';
import { z } from 'zod';
import { ValidationError } from '@/server/types/errors';

const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const { password } = UpdatePasswordSchema.parse(body);

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(ctx.userId, {
      password,
    });

    if (error) {
      throw new ValidationError(error.message);
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    return handleError(error);
  }
}

