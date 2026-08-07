import { db } from '../db/client';
import { milestones, paymentMilestones, projects } from '../db/schema/projects';
import { auditLogs } from '../db/schema/platform';
import { eq, and, desc, asc, isNull, sql } from 'drizzle-orm';

// Utility for auditing
async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/milestones',
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

export async function listMilestones(projectId: string) {
  return await db.select().from(milestones).where(and(eq(milestones.projectId, projectId), isNull(milestones.deletedAt))).orderBy(asc(milestones.dueDate));
}

export async function createMilestone(projectId: string, input: any, actorUserId: string) {
  const [ms] = await db.insert(milestones).values({
    projectId,
    name: input.name,
    description: input.description,
    dueDate: input.dueDate || null,
    status: input.status || 'pending',
    createdBy: actorUserId,
  }).returning();

  if (!ms) throw new Error('Failed to create milestone');

  await auditAction({
    userId: actorUserId,
    action: 'milestone.create',
    module: 'projects',
    targetId: ms.id,
    details: input,
  });

  return ms;
}

export async function completeMilestone(id: string, actorUserId: string) {
  let triggeredPmIds: string[] = [];

  const result = await db.transaction(async (tx) => {
    const [ms] = await tx.update(milestones).set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: actorUserId,
    }).where(and(eq(milestones.id, id), isNull(milestones.deletedAt))).returning();

    if (!ms) throw new Error('Milestone not found');

    // Trigger Payment Milestone if phase matches
    const pmToTrigger = await tx.select().from(paymentMilestones).where(and(eq(paymentMilestones.projectId, ms.projectId), eq(paymentMilestones.phase, ms.name), eq(paymentMilestones.status, 'pending'), isNull(paymentMilestones.deletedAt)));
    
    if (pmToTrigger.length > 0) {
      for (const pm of pmToTrigger) {
        await tx.update(paymentMilestones).set({
          status: 'due',
          updatedAt: new Date(),
          updatedBy: actorUserId,
        }).where(eq(paymentMilestones.id, pm.id));
        triggeredPmIds.push(pm.id);
      }
    }

    await auditAction({
      userId: actorUserId,
      action: 'milestone.complete',
      module: 'projects',
      targetId: ms.id,
      details: { triggeredPayments: pmToTrigger.length },
    });

    // Notify Project Owner
    const [project] = await tx.select().from(projects).where(eq(projects.id, ms.projectId));
    if (project?.ownerId) {
      const { users } = await import('../db/schema/identity');
      const [ownerUser] = await tx.select().from(users).where(eq(users.employeeId, project.ownerId));
      if (ownerUser) {
        const { sendNotification } = await import('./notification.service');
        await sendNotification(ownerUser.id, {
          type: 'status_change',
          title: 'Milestone Completed',
          body: `Milestone "${ms.name}" has been completed.`,
          relatedType: 'project',
          relatedId: ms.projectId,
          channel: 'in_app'
        });
      }
    }

    return ms;
  });

  // After transaction commits, generate invoices for any triggered payment milestones
  if (triggeredPmIds.length > 0) {
    const { createFromMilestone } = await import('./finance.service');
    for (const pmId of triggeredPmIds) {
      try {
        await createFromMilestone(pmId, actorUserId);
      } catch (err) {
        console.error(`Failed to auto-generate invoice for payment milestone ${pmId}`, err);
      }
    }
  }

  return result;
}

export async function listPaymentMilestones(projectId: string) {
  return await db.select().from(paymentMilestones).where(and(eq(paymentMilestones.projectId, projectId), isNull(paymentMilestones.deletedAt))).orderBy(asc(paymentMilestones.sequence));
}

export async function createPaymentMilestone(projectId: string, input: any, actorUserId: string) {
  return await db.transaction(async (tx) => {
    // Validate SUM percentage
    const existingPms = await tx.select().from(paymentMilestones).where(and(eq(paymentMilestones.projectId, projectId), isNull(paymentMilestones.deletedAt)));
    const currentSum = existingPms.reduce((sum, p) => sum + Number(p.percentage), 0);
    const newSum = currentSum + Number(input.percentage);

    if (newSum > 100) {
      throw new Error(`Adding this milestone would exceed 100% of the project budget. Current total: ${currentSum}%. Requested: ${input.percentage}%.`);
    }

    const [project] = await tx.select().from(projects).where(eq(projects.id, projectId));
    if (!project) throw new Error('Project not found');
    const budget = Number(project.budget || 0);
    const amount = budget > 0 ? (budget * (Number(input.percentage) / 100)) : input.amount;

    // Sequence calculation
    const sequence = existingPms.length > 0 ? Math.max(...existingPms.map(p => p.sequence)) + 1 : 1;

    const [pm] = await tx.insert(paymentMilestones).values({
      projectId,
      name: input.name,
      phase: input.phase || null,
      sequence,
      percentage: input.percentage,
      amount: amount || 0,
      currency: project.currency,
      expectedDate: input.expectedDate || null,
      status: 'pending',
      createdBy: actorUserId,
    }).returning();

    if (!pm) throw new Error('Failed to create payment milestone');

    await auditAction({
      userId: actorUserId,
      action: 'payment_milestone.create',
      module: 'projects',
      targetId: pm.id,
      details: input,
    });

    return pm;
  });
}
