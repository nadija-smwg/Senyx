import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { db } from '@/server/db/client';
import { users, userRoles, roles } from '@/server/db/schema/identity';
import { eq } from 'drizzle-orm';
import { listEmployees } from '@/server/services/employee.service';
import { EmployeesClient } from './employees-client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
  if (!dbUser) redirect('/login');

  const userRoleRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, dbUser.id));

  const roleNames = userRoleRows.map((r) => r.roleName);
  let scope: 'all' | 'own' = 'own';
  if (roleNames.includes('Admin') || roleNames.includes('HR Manager')) {
    scope = 'all';
  }

  const employeesData = await listEmployees(scope, dbUser.id, dbUser.employeeId || '');

  return <EmployeesClient initialData={employeesData as any[]} />;
}
