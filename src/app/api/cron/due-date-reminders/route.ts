import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { reminderSchedules, auditLogs } from '@/server/db/schema/platform';
import { projects, tasks, milestones, paymentMilestones } from '@/server/db/schema/projects';
import { users } from '@/server/db/schema/identity';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { sendNotification } from '@/server/services/notification.service';
import { emailProvider } from '@/server/lib/email-provider';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify authorization using a secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch active reminder schedules for project due dates
    const activeSchedules = await db.select().from(reminderSchedules).where(
      and(eq(reminderSchedules.type, 'project_due_dates'), eq(reminderSchedules.isActive, true))
    );

    if (activeSchedules.length === 0) {
      return NextResponse.json({ message: 'No active reminder schedules found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0]!;
    const today = new Date(todayStr);

    let totalNotificationsDispatched = 0;
    let totalEmailsSent = 0;

    for (const schedule of activeSchedules) {
      const advanceDaysStr = schedule.advanceDays || '1'; // e.g. '1,3,7'
      const advanceDays = advanceDaysStr.split(',').map(d => parseInt(d.trim()));
      
      // Calculate specific target dates (YYYY-MM-DD)
      const targetDates = advanceDays.map(days => {
        const d = new Date(today);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      });

      // Fetch all active projects and their owners
      const activeProjects = await db.select({
        projectId: projects.id,
        projectName: projects.name,
        ownerId: projects.ownerId,
        ownerUserId: users.id,
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.employeeId))
      .where(eq(projects.status, 'active'));

      // Group reminders by User ID
      const userReminders: Record<string, { upcoming: any[], overdue: any[] }> = {};

      for (const proj of activeProjects) {
        if (!proj.ownerUserId) continue; // Skip if owner doesn't have a linked user account
        const uid = proj.ownerUserId;

        if (!userReminders[uid]) {
          userReminders[uid] = { upcoming: [], overdue: [] };
        }

        // --- TASKS ---
        const projectTasks = await db.select().from(tasks).where(
          and(eq(tasks.projectId, proj.projectId), sql`${tasks.status} NOT IN ('done', 'completed')`)
        );
        for (const task of projectTasks) {
          if (!task.dueDate) continue;
          if (targetDates.includes(task.dueDate)) {
            userReminders[uid]!.upcoming.push({ type: 'Task', name: task.title, date: task.dueDate, id: task.id, projectName: proj.projectName });
          } else if (task.dueDate < todayStr) {
            userReminders[uid]!.overdue.push({ type: 'Task', name: task.title, date: task.dueDate, id: task.id, projectName: proj.projectName });
          }
        }

        // --- MILESTONES ---
        const projectMilestones = await db.select().from(milestones).where(
          and(eq(milestones.projectId, proj.projectId), sql`${milestones.status} != 'completed'`)
        );
        for (const ms of projectMilestones) {
          if (!ms.dueDate) continue;
          if (targetDates.includes(ms.dueDate)) {
            userReminders[uid]!.upcoming.push({ type: 'Milestone', name: ms.name, date: ms.dueDate, id: ms.id, projectName: proj.projectName });
          } else if (ms.dueDate < todayStr) {
            userReminders[uid]!.overdue.push({ type: 'Milestone', name: ms.name, date: ms.dueDate, id: ms.id, projectName: proj.projectName });
          }
        }

        // --- PAYMENT MILESTONES ---
        const projectPaymentMilestones = await db.select().from(paymentMilestones).where(
          and(eq(paymentMilestones.projectId, proj.projectId), sql`${paymentMilestones.status} NOT IN ('paid', 'invoiced')`)
        );
        for (const pm of projectPaymentMilestones) {
          if (!pm.expectedDate) continue;
          if (targetDates.includes(pm.expectedDate)) {
            userReminders[uid]!.upcoming.push({ type: 'Payment Milestone', name: pm.name, date: pm.expectedDate, id: pm.id, projectName: proj.projectName });
          } else if (pm.expectedDate < todayStr) {
            userReminders[uid]!.overdue.push({ type: 'Payment Milestone', name: pm.name, date: pm.expectedDate, id: pm.id, projectName: proj.projectName });
          }
        }
      }

      // Dispatch notifications and emails
      for (const [userId, items] of Object.entries(userReminders)) {
        if (items.upcoming.length === 0 && items.overdue.length === 0) continue;
        
        const allItems = [...items.overdue, ...items.upcoming];

        // 1. Send in-app notification per item
        for (const item of allItems) {
          const isOverdue = items.overdue.includes(item);
          await sendNotification(userId, {
            type: 'due_date',
            title: isOverdue ? `${item.type} Overdue` : `${item.type} Due Soon`,
            body: `[${item.projectName}] ${item.name} is ${isOverdue ? 'overdue' : 'due'} on ${item.date}.`,
            relatedType: item.type.toLowerCase().replace(' ', '_'),
            relatedId: item.id,
            channel: 'in_app',
            templateName: 'due-date-reminder'
          });
          totalNotificationsDispatched++;
        }

        // 2. Send email digest
        const [userRecord] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
        
        if (userRecord && userRecord.email) {
          let emailBody = `<p>Here is your summary of upcoming and overdue items for <strong>${todayStr}</strong>.</p>`;
          
          if (items.overdue.length > 0) {
            emailBody += `<h3>⚠️ OVERDUE</h3><ul>`;
            items.overdue.forEach(item => {
              emailBody += `<li>[${item.projectName}] ${item.type}: ${item.name} (Due: ${item.date})</li>`;
            });
            emailBody += `</ul>`;
          }

          if (items.upcoming.length > 0) {
            emailBody += `<h3>📅 DUE SOON</h3><ul>`;
            items.upcoming.forEach(item => {
              emailBody += `<li>[${item.projectName}] ${item.type}: ${item.name} (Due: ${item.date})</li>`;
            });
            emailBody += `</ul>`;
          }

          await emailProvider.send({
            to: userRecord.email,
            subject: `SENYX ERP — Due Date Summary for ${todayStr}`,
            html: emailBody
          });
          totalEmailsSent++;
        }
      }
      
      // Log to audit
      await db.insert(auditLogs).values({
        action: 'cron.due_date_reminders',
        apiRoute: '/api/cron/due-date-reminders',
        entityType: 'platform',
        entityId: schedule.id,
        result: 'success',
        after: { notifications: totalNotificationsDispatched, emails: totalEmailsSent },
        ipAddress: req.headers.get('x-forwarded-for') || 'cron',
      });
    }

    return NextResponse.json({ 
      message: 'Successfully processed scheduled reminders',
      notificationsDispatched: totalNotificationsDispatched,
      emailsSent: totalEmailsSent
    });
  } catch (error) {
    console.error('Due-date reminders cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
