import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { getSupabaseAdmin } from '@/server/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ValidationError, UnauthorizedError } from '@/server/types/errors';

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    const body = await req.json();
    const { currentPassword, password } = UpdatePasswordSchema.parse(body);

    const supabaseAdmin = getSupabaseAdmin();

    // Get user's email to verify current password
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(ctx.userId);
    if (userError || !userData.user?.email) {
      throw new UnauthorizedError('Unable to verify user identity');
    }

    // Verify current password via sign-in attempt
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });
    if (signInError) {
      throw new ValidationError('Current password is incorrect');
    }

    // Update to the new password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(ctx.userId, { password });
    if (error) {
      throw new ValidationError(error.message);
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    return handleError(error);
  }
}


