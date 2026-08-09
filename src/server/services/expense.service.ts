import { db } from '../db/client';
import { expenses } from '../db/schema/finance';
import { auditLogs } from '../db/schema/platform';
import { eq, and, desc, isNull, sql, inArray, gte, lte } from 'drizzle-orm';
import { sendNotification } from './notification.service';
import { users, roles, userRoles } from '../db/schema/identity';

async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/expenses',
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

export async function listExpenses(params: any = {}) {
  const conditions = [isNull(expenses.deletedAt)];

  if (params.approvalStatus) {
    conditions.push(eq(expenses.approvalStatus, params.approvalStatus));
  }
  if (params.category) {
    conditions.push(eq(expenses.category, params.category));
  }
  if (params.projectId) {
    conditions.push(eq(expenses.projectId, params.projectId));
  }
  if (params.startDate) {
    conditions.push(gte(expenses.expenseDate, params.startDate));
  }
  if (params.endDate) {
    conditions.push(lte(expenses.expenseDate, params.endDate));
  }
  
  if (params.userId) {
    if (params.role === 'Project Owner') {
      conditions.push(
        sql`${expenses.projectId} IN (
          SELECT id FROM projects WHERE owner_id = (
            SELECT employee_id FROM users WHERE id = ${params.userId}
          )
        )`
      );
    } else if (params.role !== 'admin' && params.role !== 'finance') {
      // Normal employee sees only their own
      conditions.push(eq(expenses.createdBy, params.userId));
    }
  }

  return await db.select().from(expenses)
    .where(and(...conditions))
    .orderBy(desc(expenses.expenseDate));
}

export async function createExpense(input: any, actorUserId: string) {
  const [expense] = await db.insert(expenses).values({
    vendor: input.vendor,
    category: input.category,
    amount: input.amount,
    currency: input.currency,
    expenseDate: input.expenseDate,
    projectId: input.projectId || null,
    receiptDocumentId: input.receiptDocumentId || null,
    approvalStatus: 'pending',
    createdBy: actorUserId,
  }).returning();

  if (!expense) throw new Error('Failed to create expense');

  await auditAction({
    userId: actorUserId,
    action: 'expense.create',
    module: 'finance',
    targetId: expense.id,
    details: { amount: input.amount, category: input.category },
  });

  // Notify finance users (assuming Finance role)
  const financeRoleRows = await db.select().from(roles).where(eq(roles.name, 'Finance'));
  const financeRoleId = financeRoleRows[0]?.id;
  if (financeRoleId) {
    const financeRoleUsers = await db.select().from(userRoles).where(eq(userRoles.roleId, financeRoleId));
    const financeUserIds = financeRoleUsers.map(r => r.userId);
    if (financeUserIds.length > 0) {
      const financeUsers = await db.select().from(users).where(inArray(users.id, financeUserIds));
      for (const fUser of financeUsers) {
        await sendNotification(fUser.id, {
          type: 'approval_request',
          title: 'New Expense Submitted',
          body: `An expense for ${input.amount} ${input.currency} requires approval.`,
          relatedType: 'expense',
          relatedId: expense.id,
          channel: 'in_app',
          templateName: 'approval-request',
          templateVariables: { target: `Expense ${input.category}` }
        });
      }
    }
  }

  return expense;
}

export async function approveExpense(id: string, decision: 'approved' | 'rejected', actorUserId: string, approverEmployeeId: string) {
  const [existing] = await db.select().from(expenses).where(and(eq(expenses.id, id), isNull(expenses.deletedAt)));
  if (!existing) throw new Error('Expense not found');
  if (existing.approvalStatus !== 'pending') throw new Error(`Cannot change decision for expense currently in ${existing.approvalStatus} status`);

  const [expense] = await db.update(expenses).set({
    approvalStatus: decision,
    approverId: approverEmployeeId,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(eq(expenses.id, id)).returning();

  if (!expense) throw new Error('Failed to update expense');

  await auditAction({
    userId: actorUserId,
    action: 'expense.approve',
    module: 'finance',
    targetId: expense.id,
    details: { decision },
  });

  if (expense.createdBy) {
    await sendNotification(expense.createdBy, {
      type: 'status_update',
      title: 'Expense Request Decided',
      body: `Your expense request has been ${decision}.`,
      relatedType: 'expense',
      relatedId: expense.id,
      channel: 'in_app',
      templateName: 'status-update',
      templateVariables: { target: 'Expense', status: decision }
    });
  }

  return expense;
}
