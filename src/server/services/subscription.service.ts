import { db } from '../db/client';
import { subscriptions } from '../db/schema/finance';
import { auditLogs } from '../db/schema/platform';
import { eq, and, desc, isNull } from 'drizzle-orm';

async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/subscriptions',
      entityType: data.module,
      entityId: data.targetId || null,
      result: 'success',
      after: data.details,
      ipAddress: data.ipAddress || '127.0.0.1',
    });
  } catch (e) {
    console.error("Failed to insert audit log", e);
  }
}

function calculateMRR(amount: string | number, interval: string): string {
  const numAmount = Number(amount);
  if (interval === 'monthly') return numAmount.toFixed(2);
  if (interval === 'quarterly') return (numAmount / 3).toFixed(2);
  if (interval === 'annual') return (numAmount / 12).toFixed(2);
  return '0.00';
}

export async function listSubscriptions(params: any = {}) {
  return await db.select().from(subscriptions).where(isNull(subscriptions.deletedAt)).orderBy(desc(subscriptions.createdAt));
}

export async function createSubscription(input: any, actorUserId: string) {
  const mrr = calculateMRR(input.amount, input.interval);

  const [sub] = await db.insert(subscriptions).values({
    accountId: input.accountId,
    productName: input.productName,
    plan: input.plan || null,
    amount: input.amount,
    currency: input.currency,
    interval: input.interval,
    status: input.status || 'active',
    startedAt: input.startedAt,
    currentPeriodEnd: input.currentPeriodEnd || null,
    mrr,
    createdBy: actorUserId,
  }).returning();

  if (!sub) throw new Error('Failed to create subscription');

  await auditAction({
    userId: actorUserId,
    action: 'subscription.create',
    module: 'finance',
    targetId: sub.id,
    details: { mrr, interval: input.interval },
  });

  return sub;
}

export async function updateSubscription(id: string, input: any, actorUserId: string) {
  const [existing] = await db.select().from(subscriptions).where(and(eq(subscriptions.id, id), isNull(subscriptions.deletedAt)));
  if (!existing) throw new Error('Subscription not found');

  const newAmount = input.amount !== undefined ? input.amount : existing.amount;
  const newInterval = input.interval !== undefined ? input.interval : existing.interval;
  const mrr = calculateMRR(newAmount, newInterval);

  const [sub] = await db.update(subscriptions).set({
    productName: input.productName !== undefined ? input.productName : existing.productName,
    plan: input.plan !== undefined ? input.plan : existing.plan,
    amount: newAmount,
    currency: input.currency !== undefined ? input.currency : existing.currency,
    interval: newInterval,
    status: input.status !== undefined ? input.status : existing.status,
    currentPeriodEnd: input.currentPeriodEnd !== undefined ? input.currentPeriodEnd : existing.currentPeriodEnd,
    mrr,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(eq(subscriptions.id, id)).returning();

  if (!sub) throw new Error('Failed to update subscription');

  await auditAction({
    userId: actorUserId,
    action: 'subscription.update',
    module: 'finance',
    targetId: sub.id,
    details: { updated: true, newStatus: sub.status },
  });

  return sub;
}
