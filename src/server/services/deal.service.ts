import { db } from '../db/client';
import { deals, dealStageHistory, quotes } from '../db/schema/sales';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { auditLogs } from '../db/schema/platform';
import { sendNotification } from './notification.service';
import { users } from '../db/schema/identity';

// Utility for auditing
async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/sales',
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

const STAGE_PROBABILITIES: Record<string, string> = {
  'lead': '10',
  'qualified': '25',
  'proposal': '50',
  'negotiation': '75',
  'won': '100',
  'lost': '0'
};

const RISK_THRESHOLDS = {
  daysInStage: 14,
  daysSinceLastActivity: 7,
};

// ----------------------------------------------------------------------------
// DEALS
// ----------------------------------------------------------------------------

export async function listDeals(scope: 'all' | 'own', currentEmployeeId: string) {
  let allDeals = await db.select().from(deals).where(isNull(deals.deletedAt)).orderBy(desc(deals.createdAt));

  if (scope === 'own') {
    allDeals = allDeals.filter(d => d.ownerId === currentEmployeeId);
  }

  // Compute indicators
  const now = new Date();
  
  // We need the latest stage history for daysInStage
  const histories = await db.select().from(dealStageHistory);

  return allDeals.map(deal => {
    // find latest history for this deal
    const dealHistories = histories.filter(h => h.dealId === deal.id).sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
    const lastStageChange = dealHistories[0]?.changedAt ?? deal.createdAt;
    
    const daysInStage = lastStageChange ? Math.floor((now.getTime() - lastStageChange.getTime()) / (1000 * 3600 * 24)) : 0;
    
    const lastActivity = deal.lastActivityAt || deal.createdAt;
    // ensure lastActivity is a Date
    const lastActivityDate = lastActivity instanceof Date ? lastActivity : new Date(lastActivity as any);
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 3600 * 24));
    
    const riskFlag = (daysInStage > RISK_THRESHOLDS.daysInStage) || (daysSinceLastActivity > RISK_THRESHOLDS.daysSinceLastActivity);

    return {
      ...deal,
      health: {
        daysInStage,
        daysSinceLastActivity,
        riskFlag,
      }
    };
  });
}

export async function createDeal(input: any, actorUserId: string, currentEmployeeId: string) {
  const stage = 'lead';
  const probability = STAGE_PROBABILITIES[stage];

  const [deal] = await db.insert(deals).values({
    name: input.name,
    accountId: input.accountId,
    ownerId: input.ownerId || currentEmployeeId,
    amount: input.amount,
    currency: input.currency || 'USD',
    stage: stage,
    probability: probability,
    expectedCloseDate: input.expectedCloseDate || null,
    source: input.source,
    createdBy: actorUserId,
    updatedBy: actorUserId,
  }).returning();

  if (!deal) throw new Error('Failed to create deal');

  // Insert initial history
  await db.insert(dealStageHistory).values({
    dealId: deal.id,
    fromStage: null,
    toStage: stage,
    changedById: actorUserId,
  });

  await auditAction({
    userId: actorUserId,
    action: 'deal.create',
    apiRoute: '/api/deals',
    module: 'sales',
    targetId: deal.id,
    details: input,
  });

  return deal;
}

export async function getDeal(id: string) {
  const [deal] = await db.select().from(deals).where(and(eq(deals.id, id), isNull(deals.deletedAt)));
  if (!deal) return null;

  // Since we don't have Drizzle relation API setup directly in these schema snippets, we do separate queries:
  // (In a real large-scale Drizzle setup, we would use query.deals.findFirst({ with: { account: true, history: true } }))
  
  // 1. Fetch Account
  const { accounts } = await import('../db/schema/crm');
  const [account] = await db.select().from(accounts).where(eq(accounts.id, deal.accountId));

  // 2. Fetch History
  const history = await db.select().from(dealStageHistory).where(eq(dealStageHistory.dealId, id)).orderBy(desc(dealStageHistory.changedAt));

  // 3. Compute Health
  const now = new Date();
  const lastStageChange = history[0]?.changedAt ?? deal.createdAt;
  const daysInStage = Math.floor((now.getTime() - lastStageChange.getTime()) / (1000 * 3600 * 24));
  
  const lastActivity = deal.lastActivityAt || deal.createdAt;
  const lastActivityDate = lastActivity instanceof Date ? lastActivity : new Date(lastActivity as any);
  const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 3600 * 24));

  return {
    ...deal,
    account: account || null,
    history: history || [],
    health: {
      daysInStage,
      daysSinceLastActivity,
      riskFlag: (daysInStage > RISK_THRESHOLDS.daysInStage) || (daysSinceLastActivity > RISK_THRESHOLDS.daysSinceLastActivity),
    }
  };
}

export async function changeDealStage(id: string, newStage: string, actorUserId: string) {
  const [currentDeal] = await db.select().from(deals).where(eq(deals.id, id));
  if (!currentDeal) throw new Error('Deal not found');

  if (currentDeal?.stage === newStage) {
    return currentDeal; // no change
  }

  const probability = STAGE_PROBABILITIES[newStage] || currentDeal.probability;

  // Insert history
  await db.insert(dealStageHistory).values({
    dealId: id,
    fromStage: currentDeal?.stage || '',
    toStage: newStage,
    changedById: actorUserId,
  });

  // Update deal
  const [updatedDeal] = await db.update(deals).set({
    stage: newStage,
    probability: probability,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(eq(deals.id, id)).returning();

  if (!updatedDeal) throw new Error('Failed to update deal stage');

  await auditAction({
    userId: actorUserId,
    action: 'deal.stage_change',
    apiRoute: `/api/deals/${id}/stage`,
    module: 'sales',
    targetId: id,
    details: { from: currentDeal.stage, to: newStage },
  });

  if (updatedDeal.ownerId) {
    const [owner] = await db.select().from(users).where(eq(users.employeeId, updatedDeal.ownerId));
    if (owner) {
      await sendNotification(owner.id, {
        type: 'status_update',
        title: 'Deal Stage Changed',
        body: `Deal ${updatedDeal.name} is now in stage ${newStage}.`,
        relatedType: 'deal',
        relatedId: updatedDeal.id,
        channel: 'in_app',
        templateName: 'status-update',
        templateVariables: { target: `Deal ${updatedDeal.name}`, status: newStage }
      });
    }
  }

  return updatedDeal;
}

export async function closeDeal(id: string, status: 'won' | 'lost', reason: string, actorUserId: string) {
  if (!reason) {
    throw new Error('win_loss_reason is required when closing a deal');
  }

  const newStage = status; // 'won' or 'lost'
  const probability = STAGE_PROBABILITIES[newStage];

  // Insert history if stage is actually changing to won/lost
  const [currentDeal] = await db.select().from(deals).where(eq(deals.id, id));
  if (currentDeal?.stage !== newStage) {
    await db.insert(dealStageHistory).values({
      dealId: id,
      fromStage: currentDeal?.stage || '',
      toStage: newStage,
      changedById: actorUserId,
    });
  }

  const [updatedDeal] = await db.update(deals).set({
    stage: newStage,
    status: status,
    probability: probability,
    winLossReason: reason,
    closedAt: new Date(),
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(eq(deals.id, id)).returning();

  if (!updatedDeal) throw new Error('Failed to update deal');

  await auditAction({
    userId: actorUserId,
    action: 'deal.close',
    apiRoute: `/api/deals/${id}/close`,
    module: 'sales',
    targetId: id,
    details: { status, reason },
  });

  if (updatedDeal.ownerId) {
    const [owner] = await db.select().from(users).where(eq(users.employeeId, updatedDeal.ownerId));
    if (owner) {
      await sendNotification(owner.id, {
        type: 'status_update',
        title: 'Deal Closed',
        body: `Deal ${updatedDeal.name} has been closed as ${status}.`,
        relatedType: 'deal',
        relatedId: updatedDeal.id,
        channel: 'in_app',
        templateName: 'status-update',
        templateVariables: { target: `Deal ${updatedDeal.name}`, status: status }
      });
    }
  }

  return updatedDeal;
}

// ----------------------------------------------------------------------------
// QUOTES
// ----------------------------------------------------------------------------

export async function listQuotes(dealId?: string) {
  const all = await db.select().from(quotes).where(isNull(quotes.deletedAt));
  if (dealId) {
    return all.filter(q => q.dealId === dealId);
  }
  return all;
}

export async function createQuote(input: any, actorUserId: string) {
  const [quote] = await db.insert(quotes).values({
    dealId: input.dealId,
    amount: input.amount,
    currency: input.currency || 'USD',
    validUntil: input.validUntil || null,
    createdBy: actorUserId,
  }).returning();

  if (!quote) throw new Error('Failed to create quote');

  await auditAction({
    userId: actorUserId,
    action: 'quote.create',
    apiRoute: '/api/quotes',
    module: 'sales',
    targetId: quote.id,
    details: input,
  });

  return quote;
}

// ----------------------------------------------------------------------------
// PIPELINE FORECASTING
// ----------------------------------------------------------------------------

export async function computeWeightedPipeline() {
  const allDeals = await db.select().from(deals).where(
    and(isNull(deals.deletedAt), eq(deals.status, 'open'))
  );

  const pipeline: Record<string, { count: number; totalAmount: number; weightedAmount: number }> = {
    lead: { count: 0, totalAmount: 0, weightedAmount: 0 },
    qualified: { count: 0, totalAmount: 0, weightedAmount: 0 },
    proposal: { count: 0, totalAmount: 0, weightedAmount: 0 },
    negotiation: { count: 0, totalAmount: 0, weightedAmount: 0 },
  };

  for (const deal of allDeals) {
    const stageData = pipeline[deal.stage!];
    if (stageData) {
      const amount = parseFloat(deal.amount?.toString() || '0');
      const probability = parseFloat(deal.probability?.toString() || '0');
      const weighted = (amount * probability) / 100;

      stageData.count += 1;
      stageData.totalAmount += amount;
      stageData.weightedAmount += weighted;
    }
  }

  return pipeline;
}
