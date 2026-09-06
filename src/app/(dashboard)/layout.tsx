import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './dashboard-layout';
import { db } from '@/server/db/client';
import { users } from '@/server/db/schema/identity';
import { eq } from 'drizzle-orm';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      }
    }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login');
  }

  // Check if user must change their temporary password
  const [dbUser] = await db.select({ mustChangePassword: users.mustChangePassword })
    .from(users)
    .where(eq(users.id, data.user.id));

  if (dbUser?.mustChangePassword) {
    redirect('/change-password');
  }

  return (
    <DashboardLayoutClient>
      {children}
    </DashboardLayoutClient>
  );
}
