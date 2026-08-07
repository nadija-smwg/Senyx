import { createServerClient } from '@supabase/ssr';
import { db } from '../db/client';
import { sessions, users, userRoles, roles, rolePermissions, permissions } from '../db/schema/identity';
import { eq, and } from 'drizzle-orm';
import { AuthContext, DeviceInfo } from '../types/context';
import { UnauthorizedError, NotFoundError } from '../types/errors';
import { withAudit } from '../lib/with-audit';

export class AuthService {
  private getSupabase(cookieStore: any) {
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

  async login(email: string, password: string, deviceInfo: DeviceInfo, ip: string, cookieStore: any) {
    const supabase = this.getSupabase(cookieStore);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const userId = data.user.id;
    const [dbUser] = await db.select().from(users).where(eq(users.id, userId));

    if (!dbUser || !dbUser.isActive) {
      throw new UnauthorizedError('User account is inactive or not found');
    }

    // Create session record
    const [session] = await db.insert(sessions).values({
      userId,
      ipAddress: ip,
      device: deviceInfo.device,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      userAgent: deviceInfo.userAgent,
    }).returning();

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

    return { user: dbUser, session, token: data.session.access_token };
  }

  async logout(ctx: AuthContext, cookieStore: any) {
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
    const [user] = await db.select().from(users).where(eq(users.id, ctx.userId));
    if (!user) throw new NotFoundError('User not found');

    return {
      user,
      roles: ctx.roles,
      permissions: ctx.permissions,
    };
  }
}

export const authService = new AuthService();
