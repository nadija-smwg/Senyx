import { cookies } from 'next/headers';
import { ChangeRequestsClient } from './change-requests-client';
import { listChangeRequests } from '../../../server/services/change-request.service';
import { db } from '../../../server/db/client';
import { users } from '../../../server/db/schema/identity';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export default async function ChangeRequestsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // get user role and employee id
  const [dbUser] = await db
    .select({
      employeeId: users.employeeId,
    })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser) redirect('/login');
  
  // Actually, Drizzle raw arrays might be tricky, let's fetch via API or just get role simply.
  // Wait, I can just call GET /api/auth/me equivalent or fetch /api/change-requests.
  // But wait! Server components can just fetch absolute URL or use internal service.
  // Let's use `listChangeRequests(isAdmin ? undefined : dbUser.employeeId)`
  
  // But wait, the standard way to check roles in server components:
  const meRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/me`, {
    headers: { cookie: cookieStore.toString() }
  });
  const meData = meRes.ok ? await meRes.json() : null;
  const isAdmin = meData?.roles?.includes('Admin');
  
  const requests = await listChangeRequests(isAdmin ? undefined : dbUser.employeeId);

  // We also need employee details for the list if admin, but let's just pass raw for now
  return <ChangeRequestsClient initialData={requests} isAdmin={isAdmin} employeeId={dbUser.employeeId} />;
}
