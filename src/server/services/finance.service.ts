import { db } from '../db/client';
import { invoices, invoiceLineItems, payments } from '../db/schema/finance';
import { paymentMilestones, projects } from '../db/schema/projects';
import { accounts } from '../db/schema/crm';
import { auditLogs, settings } from '../db/schema/platform';
import { eq, and, desc, isNull, sql, gte, lte } from 'drizzle-orm';
import { generateInvoiceNumber } from '../utils/invoice-utils';
import { sendNotification } from './notification.service';
import { users } from '../db/schema/identity';

async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/invoices',
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

export async function listInvoices(params: any = {}) {
  const conditions = [isNull(invoices.deletedAt)];

  if (params.status) {
    conditions.push(eq(invoices.status, params.status));
  }
  if (params.accountId) {
    conditions.push(eq(invoices.accountId, params.accountId));
  }
  if (params.projectId) {
    conditions.push(eq(invoices.projectId, params.projectId));
  }
  if (params.startDate) {
    conditions.push(gte(invoices.createdAt, new Date(params.startDate)));
  }
  if (params.endDate) {
    // Add one day to include the entire end date
    const endDate = new Date(params.endDate);
    endDate.setDate(endDate.getDate() + 1);
    conditions.push(lte(invoices.createdAt, endDate));
  }
  if (params.minAmount) {
    conditions.push(gte(invoices.total, params.minAmount));
  }
  if (params.maxAmount) {
    conditions.push(lte(invoices.total, params.maxAmount));
  }
  if (params.userId && params.role === 'Project Owner') {
    // Only see invoices for projects they own
    conditions.push(
      sql`${invoices.projectId} IN (
        SELECT id FROM projects WHERE owner_id = (
          SELECT employee_id FROM users WHERE id = ${params.userId}
        )
      )`
    );
  }

  const results = await db.select().from(invoices)
    .where(and(...conditions))
    .orderBy(desc(invoices.createdAt));
    
  if (results.length === 0) return [];
  
  const invoiceIds = results.map(r => r.id);
  
  // Fetch line items
  const allLineItems = await db.select().from(invoiceLineItems).where(sql`${invoiceLineItems.invoiceId} = ANY(${invoiceIds})`);
  
  // Fetch payments
  const allPayments = await db.select().from(payments).where(sql`${payments.invoiceId} = ANY(${invoiceIds})`);

  return results.map(inv => {
    const items = allLineItems.filter(li => li.invoiceId === inv.id);
    const invPayments = allPayments.filter(p => p.invoiceId === inv.id);
    
    // Calculate total payments, considering exchange_rate if available (assuming amount in base currency)
    // Actually, exchange_rate in spec is just recorded, let's just sum `amount` for now unless multi-currency is complex
    // If multi-currency, amount might be in a different currency. For simplicity, we just sum amount as base.
    const paymentTotal = invPayments.reduce((sum, p) => sum + Number(p.amount) * (Number(p.exchangeRate) || 1), 0);
    const outstandingAmount = Math.max(0, Number(inv.total) - paymentTotal);

    return {
      ...inv,
      lineItems: items,
      payments: invPayments,
      paymentTotal,
      outstandingAmount
    };
  });
}

export async function createInvoice(input: any, actorUserId: string) {
  return await db.transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumber();

    const [invoice] = await tx.insert(invoices).values({
      invoiceNumber,
      accountId: input.accountId,
      projectId: input.projectId || null,
      dealId: input.dealId || null,
      dueDate: input.dueDate || null,
      subtotal: input.subtotal,
      tax: input.tax || '0',
      total: input.total,
      currency: input.currency,
      status: 'draft',
      createdBy: actorUserId,
    } as any).returning();

    if (!invoice) throw new Error('Failed to create invoice');

    if (input.lineItems && input.lineItems.length > 0) {
      const items = input.lineItems.map((item: any) => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      }));
      await tx.insert(invoiceLineItems).values(items as any);
    }

    await auditAction({
      userId: actorUserId,
      action: 'invoice.create',
      module: 'finance',
      targetId: invoice.id,
      details: { invoiceNumber },
    });

    return invoice;
  });
}

export async function createFromMilestone(paymentMilestoneId: string, actorUserId: string) {
  return await db.transaction(async (tx) => {
    const [milestone] = await tx.select().from(paymentMilestones).where(eq(paymentMilestones.id, paymentMilestoneId));
    if (!milestone) throw new Error('Payment milestone not found');

    const [project] = await tx.select().from(projects).where(eq(projects.id, milestone.projectId));
    if (!project) throw new Error('Project not found');

    const invoiceNumber = await generateInvoiceNumber();

    const [autoIssueSetting] = await tx.select().from(settings).where(eq(settings.key, 'invoice.auto_issue'));
    const isAutoIssue = autoIssueSetting?.value === true;
    const initialStatus = isAutoIssue ? 'sent' : 'draft';
    const issueDate = isAutoIssue ? new Date().toISOString().split('T')[0] : null;

    const [invoice] = await tx.insert(invoices).values({
      invoiceNumber,
      accountId: project.accountId,
      projectId: project.id,
      paymentMilestoneId: milestone.id,
      subtotal: milestone.amount,
      tax: '0',
      total: milestone.amount,
      currency: milestone.currency,
      status: initialStatus,
      issueDate: issueDate,
      createdBy: actorUserId,
    } as any).returning();

    if (!invoice) throw new Error('Failed to create invoice');

    await tx.insert(invoiceLineItems).values({
      invoiceId: invoice.id,
      description: `Milestone Payment: ${milestone.name}`,
      quantity: '1',
      unitPrice: milestone.amount,
      amount: milestone.amount,
    } as any);

    await tx.update(paymentMilestones).set({
      invoiceId: invoice.id,
      status: 'invoiced',
      updatedAt: new Date(),
      updatedBy: actorUserId,
    }).where(eq(paymentMilestones.id, milestone.id));

    await auditAction({
      userId: actorUserId,
      action: 'invoice.create_from_milestone',
      module: 'finance',
      targetId: invoice.id,
      details: { paymentMilestoneId },
    });

    return invoice;
  });
}

export async function updateInvoice(id: string, input: any, actorUserId: string) {
  return await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(invoices).where(and(eq(invoices.id, id), isNull(invoices.deletedAt)));
    if (!existing) throw new Error('Invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be updated');

    const [invoice] = await tx.update(invoices).set({
      dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
      subtotal: input.subtotal !== undefined ? input.subtotal : existing.subtotal,
      tax: input.tax !== undefined ? input.tax : existing.tax,
      total: input.total !== undefined ? input.total : existing.total,
      updatedAt: new Date(),
      updatedBy: actorUserId,
    }).where(eq(invoices.id, id)).returning();

    // If line items are provided, replace them
    if (input.lineItems) {
      await tx.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));
      if (input.lineItems.length > 0) {
        const items = input.lineItems.map((item: any) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        }));
        await tx.insert(invoiceLineItems).values(items as any);
      }
    }

    await auditAction({
      userId: actorUserId,
      action: 'invoice.update',
      module: 'finance',
      targetId: id,
      details: { updated: true },
    });

    return invoice;
  });
}

export async function issueInvoice(id: string, actorUserId: string) {
  return await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(invoices).where(and(eq(invoices.id, id), isNull(invoices.deletedAt)));
    if (!existing) throw new Error('Invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be issued');
    if (!existing.dueDate) throw new Error('Due date must be set before issuing invoice');

    const issueDate = existing.issueDate || new Date().toISOString().split('T')[0];

    const [invoice] = await tx.update(invoices).set({
      status: 'sent',
      issueDate,
      updatedAt: new Date(),
      updatedBy: actorUserId,
    }).where(eq(invoices.id, id)).returning();

    if (!invoice) throw new Error('Failed to issue invoice');

    await auditAction({
      userId: actorUserId,
      action: 'invoice.issue',
      module: 'finance',
      targetId: id,
      details: { status: 'sent', issueDate },
    });

    // Notify Project Owner if project linked
    if (invoice.projectId) {
      const [project] = await tx.select().from(projects).where(eq(projects.id, invoice.projectId));
      if (project && project.ownerId) {
        const [owner] = await tx.select().from(users).where(eq(users.employeeId, project.ownerId));
        if (owner) {
          await sendNotification(owner.id, {
            type: 'status_update',
            title: 'Invoice Issued',
            body: `Invoice ${invoice.invoiceNumber} has been issued.`,
            relatedType: 'invoice',
            relatedId: invoice.id,
            channel: 'in_app',
            templateName: 'status-update',
            templateVariables: { target: `Invoice ${invoice.invoiceNumber}`, status: 'issued' }
          });
        }
      }
    }

    return invoice;
  });
}


export async function getAccountsReceivable() {
  const rows = await db.select().from(invoices).where(
    and(
      isNull(invoices.deletedAt),
      sql`${invoices.status} IN ('sent', 'overdue')`
    )
  );
  
  if (rows.length === 0) return { current: [], '1-30_days': [], '31-60_days': [], '90+_days': [] };

  const invoiceIds = rows.map(r => r.id);
  const allPayments = await db.select().from(payments).where(sql`${payments.invoiceId} = ANY(${invoiceIds})`);
  
  // Also fetch milestones for collection status
  const allMilestones = await db.select().from(paymentMilestones).where(sql`${paymentMilestones.id} IN (SELECT payment_milestone_id FROM invoices WHERE id = ANY(${invoiceIds}) AND payment_milestone_id IS NOT NULL)`);

  const report = {
    current: [] as any[],
    '1-30_days': [] as any[],
    '31-60_days': [] as any[],
    '90+_days': [] as any[]
  };

  const today = new Date();

  rows.forEach(inv => {
    const invPayments = allPayments.filter(p => p.invoiceId === inv.id);
    const paymentTotal = invPayments.reduce((sum, p) => sum + Number(p.amount) * (Number(p.exchangeRate) || 1), 0);
    const outstandingAmount = Math.max(0, Number(inv.total) - paymentTotal);
    
    if (outstandingAmount === 0) return; // Fully paid, shouldn't be here if status is accurate, but just in case
    
    const milestone = inv.paymentMilestoneId ? allMilestones.find(m => m.id === inv.paymentMilestoneId) : null;

    const data = {
      ...inv,
      outstandingAmount,
      milestoneStatus: milestone ? milestone.status : null
    };

    if (!inv.dueDate || new Date(inv.dueDate) >= today) {
      report.current.push(data);
    } else {
      const daysOverdue = Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24));
      if (daysOverdue <= 30) {
        report['1-30_days'].push(data);
      } else if (daysOverdue <= 60) {
        report['31-60_days'].push(data);
      } else {
        report['90+_days'].push(data);
      }
    }
  });

  return report;
}

export async function getAccountsPayable() {
  const { expenses } = await import('../db/schema/finance');
  // Pending expenses that need payment (approved but not paid)
  // Real implementation might join with payments to see what's fully paid
  return await db.select().from(expenses).where(
    and(
      isNull(expenses.deletedAt),
      eq(expenses.approvalStatus, 'approved')
    )
  );
}

export async function voidInvoice(id: string, actorUserId: string) {
  return await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(invoices).where(and(eq(invoices.id, id), isNull(invoices.deletedAt)));
    if (!existing) throw new Error('Invoice not found');
    if (existing.status === 'paid') throw new Error('Cannot void an invoice that has been paid');
    if (existing.status === 'void') throw new Error('Invoice is already voided');

    const [invoice] = await tx.update(invoices).set({
      status: 'void',
      updatedAt: new Date(),
      updatedBy: actorUserId,
    }).where(eq(invoices.id, id)).returning();

    await auditAction({
      userId: actorUserId,
      action: 'invoice.void',
      module: 'finance',
      targetId: id,
      details: { status: 'void', prevStatus: existing.status },
    });

    return invoice;
  });
}
