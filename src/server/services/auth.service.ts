import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db/client';
import { sessions, users, userRoles, roles, rolePermissions, permissions } from '../db/schema/identity';
import { employees } from '../db/schema/hr';
import { eq } from 'drizzle-orm';
import { AuthContext, DeviceInfo } from '../types/context';
import { UnauthorizedError, NotFoundError, AppError, ValidationError } from '../types/errors';
import { withAudit } from '../lib/with-audit';
import { getSupabaseAdmin } from '../lib/supabase-admin';

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
      throw new UnauthorizedError('Invalid email or password.');
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
        'Your account has been disabled. Please contact your administrator.'
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

    return {
      user: dbUser,
      session,
      token: data.session.access_token,
      mustChangePassword: dbUser.mustChangePassword,
    };
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
      mustChangePassword: userData.user.mustChangePassword,
    };
  }

  /**
   * Force-change the temporary password.
   * Called from /api/auth/force-change-password.
   * Only works when mustChangePassword is true.
   */
  async forceChangePassword(ctx: AuthContext, newPassword: string) {
    // 1. Verify user actually needs to change password
    const [dbUser] = await db.select().from(users).where(eq(users.id, ctx.userId));
    if (!dbUser) throw new NotFoundError('User not found');

    if (!dbUser.mustChangePassword) {
      throw new ValidationError('Password change is not required.');
    }

    // 2. Validate password strength
    if (newPassword.length < 12) {
      throw new ValidationError('New password must be at least 12 characters.');
    }

    // Check for character variety
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
      throw new ValidationError(
        'Password must contain uppercase, lowercase, numbers, and special characters.'
      );
    }

    // 3. Verify new password isn't the same as current password
    //    (try signing in with the new password — if it succeeds, they're reusing)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ctx.userId);
    if (!userData.user?.email) {
      throw new AppError('Unable to verify user identity', 500, 'INTERNAL_ERROR');
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error: samePassCheck } = await supabaseClient.auth.signInWithPassword({
      email: userData.user.email,
      password: newPassword,
    });
    // If sign-in succeeds with the new password, it means the new password = current password
    if (!samePassCheck) {
      // Sign out the test session immediately
      await supabaseClient.auth.signOut();
      throw new ValidationError('New password must be different from your temporary password.');
    }

    // 4. Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(ctx.userId, {
      password: newPassword,
    });
    if (updateError) {
      throw new AppError('Failed to update password. Please try again.', 500, 'PASSWORD_UPDATE_FAILED');
    }

    // 5. Clear mustChangePassword flag and set passwordChangedAt
    await db.update(users).set({
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    }).where(eq(users.id, ctx.userId));

    // 6. Audit log (no password content logged)
    try {
      const { auditLogs } = await import('../db/schema/platform');
      await db.insert(auditLogs).values({
        actorId: ctx.userId,
        action: 'auth.password_changed',
        apiRoute: ctx.apiRoute,
        entityType: 'user',
        entityId: ctx.userId,
        result: 'success',
        ipAddress: ctx.ip,
      });
    } catch {
      // Non-critical — don't fail the password change
    }

    return { message: 'Password changed successfully.' };
  }
}

export const authService = new AuthService();
