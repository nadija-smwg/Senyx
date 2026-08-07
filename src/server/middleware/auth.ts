import { NextRequest } from 'next/server';
import { AuthContext } from '../types/context';
import { parseUserAgent } from '../lib/user-agent-parser';
import { UnauthorizedError } from '../types/errors';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '../db/client';
import { users, userRoles, roles, rolePermissions, permissions } from '../db/schema/identity';
import { eq } from 'drizzle-orm';

export async function withAuth(request: NextRequest): Promise<AuthContext> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError('Authentication required');
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));

  if (!dbUser) {
    throw new UnauthorizedError('User not found in system');
  }
  
  if (!dbUser.isActive) {
    throw new UnauthorizedError('User is inactive');
  }

  // Load roles and permissions
  const userRolesData = await db
    .select({
      roleName: roles.name,
      permissionModule: permissions.module,
      permissionAction: permissions.action,
      permissionScope: permissions.scope,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, dbUser.id));

  const roleNames = Array.from(new Set(userRolesData.map((r) => r.roleName)));
  const perms = userRolesData.map((r) => ({
    module: r.permissionModule,
    action: r.permissionAction,
    scope: r.permissionScope,
  }));

  const uaString = request.headers.get('user-agent');
  const deviceInfo = parseUserAgent(uaString);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'Unknown';
  const apiRoute = request.nextUrl.pathname;

  return {
    userId: dbUser.id,
    employeeId: dbUser.employeeId, // Assuming FK to employees isn't set up yet, will be null initially? Wait, employeeId is NOT NULL in schema. It's a string/uuid.
    roles: roleNames,
    permissions: perms,
    sessionId: 'temp-session', // Will be replaced by actual session ID if we store it
    deviceInfo,
    ip,
    apiRoute,
  };
}
