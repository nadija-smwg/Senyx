import { db } from '../db/client';
import { tasks, boardColumns } from '../db/schema/projects';
import { auditLogs } from '../db/schema/platform';
import { eq, and, desc, asc, isNull, sql } from 'drizzle-orm';
import { sendNotification } from './notification.service';
import { users } from '../db/schema/identity';

// Utility for auditing
async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/tasks',
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

export async function listTasks(projectId: string) {
  return await db.select().from(tasks).where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt))).orderBy(asc(tasks.position));
}

export async function createTask(projectId: string, input: any, actorUserId: string) {
  return await db.transaction(async (tx) => {
    let columnId = input.columnId;
    if (!columnId) {
      // Find the first column (position 0 or lowest)
      const [firstCol] = await tx.select().from(boardColumns).where(and(eq(boardColumns.projectId, projectId), isNull(boardColumns.deletedAt))).orderBy(asc(boardColumns.position)).limit(1);
      if (!firstCol) throw new Error('No board columns exist for project');
      columnId = firstCol.id;
    }

    // Get max position in that column
    const [maxPosTask] = await tx.select().from(tasks).where(and(eq(tasks.columnId, columnId), isNull(tasks.deletedAt))).orderBy(desc(tasks.position)).limit(1);
    const position = maxPosTask ? maxPosTask.position + 1024 : 1024; // Use large gaps for position spacing

    const [task] = await tx.insert(tasks).values({
      projectId,
      columnId,
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId || null,
      priority: input.priority || 'medium',
      status: input.status || 'todo',
      estimateHours: input.estimateHours || null,
      dueDate: input.dueDate || null,
      position,
      createdBy: actorUserId,
    }).returning();

    if (!task) throw new Error('Failed to create task');

    await auditAction({
      userId: actorUserId,
      action: 'task.create',
      module: 'projects',
      targetId: task.id,
      details: task,
    });

    if (input.assigneeId) {
      const [assignedUser] = await tx.select().from(users).where(eq(users.employeeId, input.assigneeId));
      if (assignedUser) {
        await sendNotification(assignedUser.id, {
          type: 'assignment',
          title: 'Task Assignment',
          body: `You have been assigned to task: ${task.title}`,
          relatedType: 'task',
          relatedId: task.id,
          channel: 'in_app',
          templateName: 'assignment-notification',
          templateVariables: { target: task.title }
        });
      }
    }

    return task;
  });
}

export async function updateTask(id: string, input: any, actorUserId: string) {
  const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), isNull(tasks.deletedAt)));
  if (!existing) throw new Error('Task not found');

  const [task] = await db.update(tasks).set({
    ...input,
    dueDate: input.dueDate || undefined,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(tasks.id, id), isNull(tasks.deletedAt))).returning();

  if (!task) throw new Error('Task not found');

  await auditAction({
    userId: actorUserId,
    action: 'task.update',
    apiRoute: `/api/tasks/${id}`,
    module: 'projects',
    targetId: task.id,
    details: input,
  });

  if (input.assigneeId && input.assigneeId !== existing.assigneeId) {
    const [assignedUser] = await db.select().from(users).where(eq(users.employeeId, input.assigneeId));
    if (assignedUser) {
      await sendNotification(assignedUser.id, {
        type: 'assignment',
        title: 'Task Assignment',
        body: `You have been assigned to task: ${task.title}`,
        relatedType: 'task',
        relatedId: task.id,
        channel: 'in_app',
        templateName: 'assignment-notification',
        templateVariables: { target: task.title }
      });
    }
  }

  return task;
}

export async function moveTask(id: string, newColumnId: string, newPosition: number, actorUserId: string) {
  // Optimizated drag and drop requires updating position and potentially shuffling others if no gap exists.
  // We used a gap of 1024. `newPosition` should be calculated by the client or calculated here.
  // Assuming frontend passes the exact newPosition (e.g. between 1024 and 2048 -> 1536).
  
  const [task] = await db.update(tasks).set({
    columnId: newColumnId,
    position: newPosition,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(tasks.id, id), isNull(tasks.deletedAt))).returning();

  if (!task) throw new Error('Task not found');

  await auditAction({
    userId: actorUserId,
    action: 'task.move',
    apiRoute: `/api/tasks/${id}/move`,
    module: 'projects',
    targetId: task.id,
    details: { columnId: newColumnId, position: newPosition },
  });

  return task;
}
