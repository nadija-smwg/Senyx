import { db } from '../db/client';
import { payments, invoices } from '../db/schema/finance';
import { paymentMilestones } from '../db/schema/projects';
import { auditLogs } from '../db/schema/platform';
import { eq, and, desc, isNull, sql, inArray } from 'drizzle-orm';
import { sendNotification } from './notification.service';
import { users, roles, userRoles } from '../db/schema/identity';
import { projects } from '../db/schema/projects';

async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/payments',
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

export async function listPayments(params: any = {}) {
  return await db.select().from(payments).where(isNull(payments.deletedAt)).orderBy(desc(payments.createdAt));
}

export async function recordPayment(input: any, actorUserId: string) {
  return await db.transaction(async (tx) => {
    const [payment] = await tx.insert(payments).values({
      invoiceId: input.invoiceId || null,
      expenseId: input.expenseId || null,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      reference: input.reference || null,
      exchangeRate: input.exchangeRate || null,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      createdBy: actorUserId,
    }).returning();

    if (!payment) throw new Error('Failed to record payment');

    if (input.invoiceId) {
      // Check if invoice is fully paid
      const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, input.invoiceId));
      if (invoice) {
        // Calculate total payments against this invoice, considering exchange rate if applicable
        const paymentRows = await tx.select({ amount: payments.amount, exchangeRate: payments.exchangeRate }).from(payments).where(eq(payments.invoiceId, input.invoiceId));
        const totalPaid = paymentRows.reduce((sum, p) => sum + Number(p.amount) * (Number(p.exchangeRate) || 1), 0);

        if (totalPaid >= Number(invoice.total)) {
          // Mark invoice as paid
          await tx.update(invoices).set({
            status: 'paid',
            paidAt: payment.paidAt,
            updatedAt: new Date(),
            updatedBy: actorUserId,
          }).where(eq(invoices.id, invoice.id));

          // Check if invoice belongs to a milestone, mark it as paid too
          if (invoice.paymentMilestoneId) {
            await tx.update(paymentMilestones).set({
              status: 'paid',
              updatedAt: new Date(),
              updatedBy: actorUserId,
            }).where(eq(paymentMilestones.id, invoice.paymentMilestoneId));
          }
        }
      }
    }

    await auditAction({
      userId: actorUserId,
      action: 'payment.create',
      module: 'finance',
      targetId: payment.id,
      details: { amount: input.amount, invoiceId: input.invoiceId, expenseId: input.expenseId },
    });

    // Notify Finance
    const financeRoleRows = await tx.select().from(roles).where(eq(roles.name, 'Finance'));
    const financeRoleId = financeRoleRows[0]?.id;
    if (financeRoleId) {
      const financeRoleUsers = await tx.select().from(userRoles).where(eq(userRoles.roleId, financeRoleId));
      const financeUserIds = financeRoleUsers.map(r => r.userId);
      if (financeUserIds.length > 0) {
        const financeUsers = await tx.select().from(users).where(inArray(users.id, financeUserIds));
        for (const fUser of financeUsers) {
          await sendNotification(fUser.id, {
            type: 'status_update',
            title: 'Payment Received',
            body: `A payment of ${input.amount} ${input.currency} has been recorded.`,
            relatedType: 'payment',
            relatedId: payment.id,
            channel: 'in_app',
            templateName: 'status-update',
            templateVariables: { target: 'Payment', status: 'received' }
          });
        }
      }
    }

    // Notify Project Owner if linked to an invoice with a project
    if (input.invoiceId) {
      const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, input.invoiceId));
      if (invoice?.projectId) {
        const [project] = await tx.select().from(projects).where(eq(projects.id, invoice.projectId));
        if (project?.ownerId) {
          const [owner] = await tx.select().from(users).where(eq(users.employeeId, project.ownerId));
          if (owner) {
            await sendNotification(owner.id, {
              type: 'status_update',
              title: 'Invoice Payment Received',
              body: `A payment was received for invoice ${invoice.invoiceNumber}.`,
              relatedType: 'invoice',
              relatedId: invoice.id,
              channel: 'in_app',
              templateName: 'status-update',
              templateVariables: { target: `Invoice ${invoice.invoiceNumber}`, status: 'paid' }
            });
          }
        }
      }
    }

    return payment;
  });
}
