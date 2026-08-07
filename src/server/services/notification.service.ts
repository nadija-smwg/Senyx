import { db } from '../db/client';
import { notifications } from '../db/schema/platform';
import { users } from '../db/schema/identity';
import { eq, and, desc } from 'drizzle-orm';
import { emailProvider, renderTemplate } from '../lib/email-provider';

import { sql } from 'drizzle-orm';
export async function listNotifications(userId: string, params: any = {}) {
  const conditions = [eq(notifications.userId, userId)];

  if (params.isRead !== undefined) {
    conditions.push(eq(notifications.isRead, params.isRead));
  }
  if (params.type) {
    conditions.push(eq(notifications.type, params.type));
  }
  if (params.startDate) {
    conditions.push(sql`${notifications.createdAt} >= ${new Date(params.startDate)}`);
  }
  if (params.endDate) {
    // Add 1 day to include the end date fully if it's just a YYYY-MM-DD string
    const end = new Date(params.endDate);
    end.setDate(end.getDate() + 1);
    conditions.push(sql`${notifications.createdAt} < ${end}`);
  }

  const limit = params.limit ? parseInt(params.limit) : 50;
  const offset = params.offset ? parseInt(params.offset) : 0;

  const results = await db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
    
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(...conditions));
  const count = countResult[0]?.count || 0;
    
  return { items: results, total: count };
}

export async function getUnreadCount(userId: string) {
  const result = await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result.length;
}

export async function markAsRead(notificationId: string, userId: string) {
  const [notification] = await db.update(notifications)
    .set({ isRead: true, updatedAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();
  return notification;
}

export async function markAllAsRead(userId: string) {
  await db.update(notifications)
    .set({ isRead: true, updatedAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function createNotification(userId: string, input: any) {
  const [notification] = await db.insert(notifications).values({
    userId,
    type: input.type,
    title: input.title,
    body: input.body,
    relatedType: input.relatedType || null,
    relatedId: input.relatedId || null,
    channel: input.channel || 'in_app',
  }).returning();
  return notification;
}

export async function sendNotification(userId: string, input: any) {
  // 1. Always create the in-app notification first
  const notification = await createNotification(userId, input);

  // 2. Fetch user to check preferences & email address
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (user && user.email) {
    // For now, if the input dictates an email should be sent, or if channel is explicit
    if (input.channel === 'email' || input.channel === 'both' || input.forceEmail) {
      const templateName = input.templateName || 'default';
      const variables = input.templateVariables || { target: input.title };
      
      const { html, text } = renderTemplate(templateName, variables);

      const success = await emailProvider.send({
        to: user.email,
        subject: input.title,
        html,
        text
      });
      
      if (success && notification?.id) {
        await db.update(notifications)
          .set({ sentAt: new Date() })
          .where(eq(notifications.id, notification.id));
      }
    }
  }

  return notification;
}
