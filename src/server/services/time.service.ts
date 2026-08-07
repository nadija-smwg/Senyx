import { db } from '../db/client';
import { timeEntries, clockSessions } from '../db/schema/projects';
import { auditLogs } from '../db/schema/platform';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';

// Utility for auditing
async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/time',
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

export async function listTimeEntries(projectId: string) {
  return await db.select().from(timeEntries).where(and(eq(timeEntries.projectId, projectId), isNull(timeEntries.deletedAt))).orderBy(desc(timeEntries.workDate));
}

export async function logTime(projectId: string, input: any, actorUserId: string) {
  if (new Date(input.workDate) > new Date()) {
    throw new Error('Cannot log time in the future');
  }
  if (input.hours <= 0 || input.hours > 24) {
    throw new Error('Hours must be between 0 and 24');
  }

  const [entry] = await db.insert(timeEntries).values({
    projectId,
    taskId: input.taskId || null,
    employeeId: actorUserId,
    workDate: input.workDate,
    hours: input.hours,
    description: input.description,
    billable: input.billable !== undefined ? input.billable : true,
    source: 'manual',
    createdBy: actorUserId,
  }).returning();

  if (!entry) throw new Error('Failed to log time');

  await auditAction({
    userId: actorUserId,
    action: 'time.log',
    module: 'projects',
    targetId: entry.id,
    details: input,
  });

  return entry;
}

export async function getActiveClock(employeeId: string) {
  const [clock] = await db.select().from(clockSessions).where(and(eq(clockSessions.employeeId, employeeId), eq(clockSessions.isActive, true), isNull(clockSessions.deletedAt)));
  return clock || null;
}

export async function clockIn(projectId: string, taskId: string | undefined, actorUserId: string) {
  const activeClock = await getActiveClock(actorUserId);
  if (activeClock) {
    throw new Error('You already have an active clock session running.');
  }

  const [clock] = await db.insert(clockSessions).values({
    projectId,
    taskId: taskId || null,
    employeeId: actorUserId,
    isActive: true,
    createdBy: actorUserId,
  }).returning();

  if (!clock) throw new Error('Failed to clock in');

  await auditAction({
    userId: actorUserId,
    action: 'clock.in',
    module: 'projects',
    targetId: clock.id,
    details: { projectId, taskId },
  });

  return clock;
}

export async function clockOut(actorUserId: string) {
  const activeClock = await getActiveClock(actorUserId);
  if (!activeClock) {
    throw new Error('No active clock session found.');
  }

  const clockOutTime = new Date();
  const clockInTime = new Date(activeClock.clockInAt);
  const durationSeconds = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / 1000);
  const hours = Number((durationSeconds / 3600).toFixed(2));

  return await db.transaction(async (tx) => {
    const [clock] = await tx.update(clockSessions).set({
      clockOutAt: clockOutTime,
      durationSeconds,
      isActive: false,
      updatedAt: clockOutTime,
      updatedBy: actorUserId,
    }).where(eq(clockSessions.id, activeClock.id)).returning();

    if (!clock) throw new Error('Failed to update clock session');

    // Create time entry automatically if duration > 60 seconds
    let entry = null;
    if (durationSeconds > 60) {
      const [newEntry] = await tx.insert(timeEntries).values({
        projectId: activeClock.projectId!,
        taskId: activeClock.taskId ?? null,
        employeeId: actorUserId,
        workDate: clockOutTime.toISOString().split('T')[0],
        hours: String(hours),
        description: 'Auto-logged via Clock',
        billable: true,
        source: 'clock' as 'manual' | 'clock',
        clockSessionId: activeClock.id,
        createdBy: actorUserId,
      } as any).returning();
      entry = newEntry;
    }

    await auditAction({
      userId: actorUserId,
      action: 'clock.out',
      module: 'projects',
      targetId: clock.id,
      details: { durationSeconds, hours },
    });

    return { clock, entry };
  });
}
