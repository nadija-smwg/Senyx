import { createServerClient } from '@supabase/ssr';
import { db } from '../db/client';
import { sessions, users, userRoles, roles, rolePermissions, permissions } from '../db/schema/identity';
import { employees } from '../db/schema/hr';
import { eq } from 'drizzle-orm';
import { AuthContext, DeviceInfo } from '../types/context';
import { UnauthorizedError, NotFoundError, AppError } from '../types/errors';
import { withAudit } from '../lib/with-audit';

type CookieStore = {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options: any) => void;
};

export class AuthService {
  private getSupabase(cookieStore: CookieStore) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch { }
          }
        }
      }
    );
  }

  async login(email: string, password: string, deviceInfo: DeviceInfo, ip: string, cookieStore: CookieStore) {
    const supabase = this.getSupabase(cookieStore);

    // 1. Authenticate against Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new UnauthorizedError(error?.message || 'Invalid credentials');
    }

    const userId = data.user.id;

    // 2. Verify user exists in our DB (must have been created by admin)
    const [dbUser] = await db.select().from(users).where(eq(users.id, userId));

    if (!dbUser) {
      // Sign out from Supabase so the session is not kept
      await supabase.auth.signOut();
      throw new UnauthorizedError(
        'Your account has not been provisioned. Please contact your administrator.'
      );
    }

    // 3. Check user account is active
    if (!dbUser.isActive) {
      await supabase.auth.signOut();
      throw new UnauthorizedError(
        'Your account has been deactivated. Please contact your administrator.'
      );
    }

    // 4. Check linked employee record is active
    const [employee] = await db.select().from(employees).where(eq(employees.id, dbUser.employeeId));

    if (!employee) {
      await supabase.auth.signOut();
      throw new UnauthorizedError('Employee record not found. Please contact your administrator.');
    }

    if (employee.status !== 'active') {
      await supabase.auth.signOut();
      throw new UnauthorizedError(
        employee.status === 'suspended'
          ? 'Your account has been suspended. Please contact your administrator.'
          : 'Your account is not in an active state. Please contact your administrator.'
      );
    }

    // 5. Create session record
    const [session] = await db.insert(sessions).values({
      userId,
      ipAddress: ip,
      device: deviceInfo.device,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      userAgent: deviceInfo.userAgent,
    }).returning();

    // 6. Update last login timestamp
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

    return { user: dbUser, session, token: data.session.access_token };
  }

  async logout(ctx: AuthContext, cookieStore: CookieStore) {
    const supabase = this.getSupabase(cookieStore);
    await supabase.auth.signOut();

    await withAudit(ctx, 'auth.logout', 'session', ctx.sessionId, async (tx) => {
      if (ctx.sessionId !== 'temp-session') {
        const [session] = await tx.select().from(sessions).where(eq(sessions.id, ctx.sessionId));
        if (session && session.startedAt) {
          const endedAt = new Date();
          const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);
          await tx.update(sessions)
            .set({ endedAt, durationSeconds, isActive: false })
            .where(eq(sessions.id, ctx.sessionId));
        }
      }
      return { result: true };
    });
  }

  async getMe(ctx: AuthContext) {
    const [userData] = await db
      .select({
        user: users,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName,
        }
      })
      .from(users)
      .innerJoin(employees, eq(users.employeeId, employees.id))
      .where(eq(users.id, ctx.userId));

    if (!userData) throw new NotFoundError('User not found');

    return {
      user: {
        ...userData.user,
        firstName: userData.employee.firstName,
        lastName: userData.employee.lastName,
      },
      roles: ctx.roles,
      permissions: ctx.permissions,
    };
  }
}

export const authService = new AuthService();
