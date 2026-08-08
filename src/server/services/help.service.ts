import { db } from '../db/client';
import { settings } from '../db/schema/platform';
import { eq, like } from 'drizzle-orm';
import { auditLogs } from '../db/schema/platform';
import { AuthContext } from '../types/context';

export interface HelpSection {
  slug: string;
  title: string;
  content: string;
  roles: string[];
}

export async function getHelpSections(ctx: AuthContext): Promise<HelpSection[]> {
  const allSettings = await db.select().from(settings).where(like(settings.key, 'help.%'));
  
  const sections = allSettings.map(s => {
    const val = s.value as any;
    return {
      slug: s.key.replace('help.', ''),
      title: val.title || 'Untitled',
      content: val.content || '',
      roles: val.roles || [],
    } as HelpSection;
  });

  // Filter based on user roles
  // If a help section has no specific roles assigned, it's public to all authenticated users.
  // Otherwise, the user must have at least one of the required roles (or be 'admin').
  return sections.filter(sec => {
    if (ctx.roles.includes('admin')) return true;
    if (!sec.roles || sec.roles.length === 0) return true;
    return sec.roles.some((role: string) => ctx.roles.includes(role));
  });
}

export async function getHelpSection(ctx: AuthContext, slug: string): Promise<HelpSection | null> {
  const [setting] = await db.select().from(settings).where(eq(settings.key, `help.${slug}`));
  
  if (!setting) return null;

  const val = setting.value as any;
  const section = {
    slug,
    title: val.title || 'Untitled',
    content: val.content || '',
    roles: val.roles || [],
  };

  // Role check
  if (!ctx.roles.includes('admin') && section.roles.length > 0) {
    const hasAccess = section.roles.some((role: string) => ctx.roles.includes(role));
    if (!hasAccess) {
      throw new Error('Forbidden: You do not have access to this help section.');
    }
  }

  return section;
}

export async function updateHelpSection(
  ctx: AuthContext, 
  slug: string, 
  data: { title: string, content: string, roles?: string[] }
): Promise<void> {
  if (!ctx.roles.includes('admin')) {
    throw new Error('Forbidden: Only administrators can update help content.');
  }

  const key = `help.${slug}`;
  const [existing] = await db.select().from(settings).where(eq(settings.key, key));

  const payload = {
    title: data.title,
    content: data.content,
    roles: data.roles || (existing ? (existing.value as any).roles : []),
  };

  if (existing) {
    await db.update(settings).set({ value: payload }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({
      key,
      value: payload
    });
  }

  await db.insert(auditLogs).values({
    actorId: ctx.userId,
    action: 'help.update',
    entityType: 'settings',
    entityId: existing?.id || null, // Best effort
    apiRoute: ctx.apiRoute,
    ipAddress: ctx.ip || '',
    device: ctx.deviceInfo.device,
    os: ctx.deviceInfo.os,
    browser: ctx.deviceInfo.browser,
    result: 'success',
  });
}

export async function searchHelp(ctx: AuthContext, query: string): Promise<HelpSection[]> {
  const sections = await getHelpSections(ctx);
  const lowerQuery = query.toLowerCase();
  
  return sections.filter(sec => 
    sec.title.toLowerCase().includes(lowerQuery) || 
    sec.content.toLowerCase().includes(lowerQuery)
  );
}
