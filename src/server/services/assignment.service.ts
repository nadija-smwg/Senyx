import { db } from '../db/client';
import { projectAssignments, projectRisks } from '../db/schema/projects';
import { auditLogs } from '../db/schema/platform';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { sendNotification } from './notification.service';
import { users } from '../db/schema/identity';

import { employees } from '../db/schema/hr';

// Utility for auditing
async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: data.apiRoute || '/api/projects',
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

export async function listAssignments(projectId: string) {
  return await db
    .select({
      id: projectAssignments.id,
      projectId: projectAssignments.projectId,
      employeeId: projectAssignments.employeeId,
      roleOnProject: projectAssignments.roleOnProject,
      allocationPct: projectAssignments.allocationPct,
      assignedAt: projectAssignments.assignedAt,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
    })
    .from(projectAssignments)
    .leftJoin(employees, eq(projectAssignments.employeeId, employees.id))
    .where(and(eq(projectAssignments.projectId, projectId), isNull(projectAssignments.unassignedAt)));
}

export async function assign(projectId: string, input: any, actorUserId: string) {
  // Check not already actively assigned
  const existing = await db.select().from(projectAssignments).where(and(eq(projectAssignments.projectId, projectId), eq(projectAssignments.employeeId, input.employeeId), isNull(projectAssignments.unassignedAt)));
  if (existing.length > 0) {
    throw new Error('Employee is already actively assigned to this project.');
  }

  const [assignment] = await db.insert(projectAssignments).values({
    projectId,
    employeeId: input.employeeId,
    roleOnProject: input.roleOnProject,
    allocationPct: input.allocationPct || null,
    createdBy: actorUserId,
  }).returning();

  if (!assignment) throw new Error('Failed to create assignment');

  await auditAction({
    userId: actorUserId,
    action: 'assignment.create',
    module: 'projects',
    targetId: assignment.id,
    details: input,
  });

  const [assignedUser] = await db.select().from(users).where(eq(users.employeeId, input.employeeId));
  if (assignedUser) {
    await sendNotification(assignedUser.id, {
      type: 'assignment',
      title: 'Project Assignment',
      body: `You have been assigned to a new project.`,
      relatedType: 'project',
      relatedId: projectId,
      channel: 'in_app',
      templateName: 'assignment-notification',
      templateVariables: { target: 'a new project' }
    });
  }

  return assignment;
}

export async function unassign(id: string, actorUserId: string) {
  const [assignment] = await db.update(projectAssignments).set({
    unassignedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(projectAssignments.id, id), isNull(projectAssignments.unassignedAt))).returning();

  if (!assignment) throw new Error('Active assignment not found');

  await auditAction({
    userId: actorUserId,
    action: 'assignment.remove',
    module: 'projects',
    targetId: id,
  });

  return true;
}

// ----------------------------------------------------------------------------
// PROJECT RISKS
// ----------------------------------------------------------------------------
export async function listRisks(projectId: string) {
  return await db.select().from(projectRisks).where(and(eq(projectRisks.projectId, projectId), isNull(projectRisks.deletedAt)));
}

export async function createRisk(projectId: string, input: any, actorUserId: string) {
  const [risk] = await db.insert(projectRisks).values({
    projectId,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: input.status || 'open',
    ownerId: input.ownerId || null,
    createdBy: actorUserId,
  }).returning();

  if (!risk) throw new Error('Failed to create risk');

  await auditAction({
    userId: actorUserId,
    action: 'risk.create',
    module: 'projects',
    targetId: risk.id,
    details: input,
  });

  return risk;
}

export async function updateRisk(id: string, input: any, actorUserId: string) {
  const [risk] = await db.update(projectRisks).set({
    ...input,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(projectRisks.id, id), isNull(projectRisks.deletedAt))).returning();

  if (!risk) throw new Error('Risk not found');

  await auditAction({
    userId: actorUserId,
    action: 'risk.update',
    module: 'projects',
    targetId: id,
    details: input,
  });

  return risk;
}
