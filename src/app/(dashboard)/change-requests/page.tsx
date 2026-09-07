import { cookies } from 'next/headers';
import { ChangeRequestsClient } from './change-requests-client';
import { listChangeRequests } from '../../../server/services/change-request.service';
import { db } from '../../../server/db/client';
import { users, userRoles, roles } from '../../../server/db/schema/identity';
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

  // Fetch user record and their roles directly from DB (no HTTP fetch needed)
  const [dbUser] = await db
    .select({
      employeeId: users.employeeId,
    })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser) redirect('/login');

  const userRoleRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, user.id));

  const isAdmin = userRoleRows.some((r) => r.roleName === 'Admin');

  const requests = await listChangeRequests(isAdmin ? undefined : dbUser.employeeId);

  return <ChangeRequestsClient initialData={requests} isAdmin={isAdmin} employeeId={dbUser.employeeId} />;
}
