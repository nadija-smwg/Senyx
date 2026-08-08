import { createServerClient } from '@supabase/ssr';
import { db } from '../db/client';
import { sessions, users, userRoles, roles, rolePermissions, permissions } from '../db/schema/identity';
import { employees, designations } from '../db/schema/hr';
import { eq, and } from 'drizzle-orm';
import { AuthContext, DeviceInfo } from '../types/context';
import { UnauthorizedError, NotFoundError, AppError } from '../types/errors';
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
      throw new UnauthorizedError(error?.message || 'Invalid credentials');
    }

    const userId = data.user.id;
    let [dbUser] = await db.select().from(users).where(eq(users.id, userId));

    // First-time login after email verification: provision DB records
    if (!dbUser) {
      const meta = data.user.user_metadata || {};
      try {
        dbUser = await db.transaction(async (tx) => {
          let [employee] = await tx.select().from(employees).where(eq(employees.email, data.user.email!)).limit(1);

          if (!employee) {
            let [designation] = await tx.select().from(designations).limit(1);
            if (!designation) {
              [designation] = await tx.insert(designations).values({
                title: 'Guest',
                description: 'Default designation for new users',
              }).returning();
            }
            const employeeCode = `EMP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
            [employee] = await tx.insert(employees).values({
              firstName: meta.firstName || meta.first_name || 'New',
              lastName: meta.lastName || meta.last_name || 'User',
              email: data.user.email!,
              employeeCode,
              designationId: designation!.id,
              employmentType: 'full_time',
              startDate: new Date().toISOString().split('T')[0] as string,
              status: 'active',
            }).returning();
          }

          const [newUser] = await tx.insert(users).values({
            id: userId,
            employeeId: employee!.id,
            email: data.user.email!,
            isActive: true,
          }).returning();
          
          return newUser;
        });
      } catch (err) {
        console.error('Failed to provision database records for new user:', err);
        throw new AppError('Failed to setup your account profile. Please try logging in again.', 500, 'PROFILE_SETUP_FAILED');
      }
    }

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

  async register(input: any, cookieStore: any) {
    // Check if email already exists in our DB
    const [existingByEmail] = await db.select().from(users).where(eq(users.email, input.email));
    if (existingByEmail) {
      throw new AppError('An account with this email already exists. Please log in instead.', 400, 'AUTH_ERROR');
    }

    const supabase = this.getSupabase(cookieStore);

    // Sign up in Supabase — stores firstName/lastName in metadata for later use
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      },
    });

    if (error) {
      console.error('Supabase signUp failed:', error);
      const msg = error.message && error.message !== '{}' 
        ? error.message 
        : 'Registration rejected by authentication provider. The email may already be in use.';
      throw new AppError(msg, 400, 'AUTH_ERROR');
    }

    // Always return success — user will verify email then log in
    // DB records (employee + user) are created on first successful login
    return { success: true };
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
