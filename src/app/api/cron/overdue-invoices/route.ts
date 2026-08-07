import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { invoices } from '@/server/db/schema/finance';
import { auditLogs } from '@/server/db/schema/platform';
import { users, roles, userRoles } from '@/server/db/schema/identity';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { sendNotification } from '@/server/services/notification.service';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify authorization using a secret (Vercel Cron standard)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Find overdue invoices (sent and due date is past)
    const today = new Date().toISOString().split('T')[0];
    
    // Instead of doing complex joins or Drizzle specifics for dates, 
    // we use sql tagged template for the condition.
    const overdueInvoices = await db.select().from(invoices).where(
      and(
        eq(invoices.status, 'sent'),
        sql`${invoices.deletedAt} IS NULL`,
        sql`${invoices.dueDate} < ${today}`
      )
    );

    if (overdueInvoices.length === 0) {
      return NextResponse.json({ message: 'No overdue invoices found.' });
    }

    // 3. Mark them overdue and log
    const updatedIds: string[] = [];
    
    await db.transaction(async (tx) => {
      for (const invoice of overdueInvoices) {
        await tx.update(invoices).set({
          status: 'overdue',
          updatedAt: new Date(),
        }).where(eq(invoices.id, invoice.id));
        updatedIds.push(invoice.id);

        await tx.insert(auditLogs).values({
          action: 'invoice.overdue',
          apiRoute: '/api/cron/overdue-invoices',
          entityType: 'finance',
          entityId: invoice.id,
          result: 'success',
          after: { status: 'overdue', prevStatus: 'sent' },
          ipAddress: req.headers.get('x-forwarded-for') || 'cron',
        });
      }
    });

    // 4. Notify Finance users
    if (updatedIds.length > 0) {
      const financeRoleRows = await db.select().from(roles).where(eq(roles.name, 'Finance'));
      const financeRoleId = financeRoleRows[0]?.id;
      if (financeRoleId) {
        const financeRoleUsers = await db.select().from(userRoles).where(eq(userRoles.roleId, financeRoleId));
        const financeUserIds = financeRoleUsers.map(r => r.userId);
        if (financeUserIds.length > 0) {
          const financeUsers = await db.select().from(users).where(inArray(users.id, financeUserIds));
          for (const invoice of overdueInvoices) {
            for (const fUser of financeUsers) {
              await sendNotification(fUser.id, {
                type: 'status_update',
                title: 'Invoice Overdue',
                body: `Invoice ${invoice.invoiceNumber} is now overdue. Amount: ${invoice.total} ${invoice.currency}`,
                relatedType: 'invoice',
                relatedId: invoice.id,
                channel: 'in_app',
                templateName: 'status-update'
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      message: 'Successfully processed overdue invoices',
      count: updatedIds.length,
      invoiceIds: updatedIds
    });
  } catch (error) {
    console.error('Overdue invoice cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
