import { db } from '../db/client';
import { projects, projectAssignments, boardColumns, tasks, timeEntries, paymentMilestones, milestones } from '../db/schema/projects';
import { auditLogs } from '../db/schema/platform';
import { eq, and, desc, asc, isNull, inArray, sum, count } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { sendNotification } from './notification.service';
import { users } from '../db/schema/identity';
import { AppError } from '../types/errors';

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

export async function generateProjectCode() {
  const [latest] = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(1);
  if (!latest || !latest.code.startsWith('PRJ-')) {
    return 'PRJ-0001';
  }
  const codeStr = latest.code || 'PRJ-0000';
  const num = parseInt(codeStr.split('-')[1] || '0', 10);
  return `PRJ-${String(num + 1).padStart(4, '0')}`;
}

export async function listProjects(scope: 'all' | 'own' | 'assigned', currentEmployeeId: string | null) {
  let query = db.select().from(projects).where(isNull(projects.deletedAt));

  if (scope === 'own') {
    if (!currentEmployeeId) return [];
    query = db.select().from(projects).where(and(isNull(projects.deletedAt), eq(projects.ownerId, currentEmployeeId)));
  } else if (scope === 'assigned') {
    if (!currentEmployeeId) return [];
    // Requires join or subquery
    // using subquery for simplicity
    const sq = db.select({ projectId: projectAssignments.projectId }).from(projectAssignments).where(eq(projectAssignments.employeeId, currentEmployeeId));
    query = db.select().from(projects).where(and(isNull(projects.deletedAt), inArray(projects.id, sq)));
  }

  const allProjects = await query.orderBy(desc(projects.createdAt));
  
  // Basic aggregation can be done here or mapped. For a real app we'd do a complex SQL join.
  // We'll return them as is for list view to keep it fast, the frontend can fetch details if needed, 
  // or we can attach minimal stats.
  return allProjects;
}

export async function createProject(input: any, actorUserId: string, currentEmployeeId: string) {
  const code = await generateProjectCode();
  
  if (input.type === 'solution' && !input.accountId) {
    throw new AppError('Solution projects require an associated account. Please select an account or change the project type.', 400, 'VALIDATION_ERROR');
  }

  return await db.transaction(async (tx) => {
    const [project] = await tx.insert(projects).values({
      code,
      name: input.name,
      type: input.type,
      accountId: input.accountId || null,
      dealId: input.dealId || null,
      ownerId: input.ownerId || currentEmployeeId,
      billingType: input.billingType || 'fixed',
      status: input.status || 'planning',
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      budget: input.budget || null,
      currency: input.currency || 'USD',
      createdBy: actorUserId,
    }).returning();

    if (!project) throw new Error('Failed to create project');

    // Create default board columns
    const defaultCols = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
    await tx.insert(boardColumns).values(defaultCols.map((name, idx) => ({
      projectId: project.id,
      name,
      position: idx,
      createdBy: actorUserId,
    })));

    // Assign owner
    await tx.insert(projectAssignments).values({
      projectId: project.id,
      employeeId: project.ownerId,
      roleOnProject: 'Project Owner',
      allocationPct: '100',
      createdBy: actorUserId,
    });

    await auditAction({
      userId: actorUserId,
      action: 'project.create',
      apiRoute: '/api/projects',
      module: 'projects',
      targetId: project.id,
      details: project,
    });

    return project;
  });
}

export async function getProjectById(id: string) {
  const [project] = await db.select().from(projects).where(and(eq(projects.id, id), isNull(projects.deletedAt)));
  if (!project) return null;

  const assignments = await db.select().from(projectAssignments).where(eq(projectAssignments.projectId, id));
  const ms = await db.select().from(milestones).where(eq(milestones.projectId, id));
  const payMs = await db.select().from(paymentMilestones).where(eq(paymentMilestones.projectId, id));

  return {
    ...project,
    assignments,
    milestones: ms,
    paymentMilestones: payMs,
  };
}

export async function updateProject(id: string, input: any, actorUserId: string) {
  const [existing] = await db.select().from(projects).where(and(eq(projects.id, id), isNull(projects.deletedAt)));
  if (!existing) throw new Error('Project not found');

  const [project] = await db.update(projects).set({
    ...input,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    updatedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(projects.id, id), isNull(projects.deletedAt))).returning();

  if (!project) throw new Error('Project not found');

  await auditAction({
    userId: actorUserId,
    action: 'project.update',
    apiRoute: `/api/projects/${id}`,
    module: 'projects',
    targetId: id,
    details: input,
  });

  if (input.status && input.status !== existing.status) {
    // Notify owner
    const [ownerUser] = await db.select().from(users).where(eq(users.employeeId, project.ownerId));
    if (ownerUser) {
      await sendNotification(ownerUser.id, {
        type: 'status_update',
        title: `Project Status Changed`,
        body: `Project ${project.name} is now ${project.status}`,
        relatedType: 'project',
        relatedId: project.id,
        channel: 'in_app',
        templateName: 'status-update',
        templateVariables: { target: project.name, status: project.status }
      });
    }
  }

  return project;
}

export async function deleteProject(id: string, actorUserId: string) {
  const [project] = await db.update(projects).set({
    deletedAt: new Date(),
    updatedBy: actorUserId,
  }).where(and(eq(projects.id, id), isNull(projects.deletedAt))).returning();

  if (!project) throw new Error('Project not found');

  await auditAction({
    userId: actorUserId,
    action: 'project.delete',
    apiRoute: `/api/projects/${id}`,
    module: 'projects',
    targetId: id,
  });

  return true;
}

export async function getBoard(projectId: string) {
  const cols = await db.select().from(boardColumns).where(and(eq(boardColumns.projectId, projectId), isNull(boardColumns.deletedAt))).orderBy(asc(boardColumns.position));
  const projectTasks = await db.select().from(tasks).where(and(eq(tasks.projectId, projectId), isNull(tasks.deletedAt))).orderBy(asc(tasks.position));

  return cols.map(col => ({
    ...col,
    tasks: projectTasks.filter(t => t.columnId === col.id),
  }));
}

export async function getSummary(projectId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) throw new Error('Not found');

  const board = await getBoard(projectId);
  
  // Total time
  const [timeStats] = await db.select({
    totalHours: sql<number>`COALESCE(SUM(${timeEntries.hours}), 0::numeric)`,
    billableHours: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntries.billable} = true THEN ${timeEntries.hours} ELSE 0::numeric END), 0::numeric)`,
  }).from(timeEntries).where(and(eq(timeEntries.projectId, projectId), isNull(timeEntries.deletedAt)));

  const totalHours = Number(timeStats?.totalHours || 0);
  const billableHours = Number(timeStats?.billableHours || 0);

  // Payment milestones
  const [pmStats] = await db.select({
    collected: sql<number>`COALESCE(SUM(CASE WHEN ${paymentMilestones.status} = 'paid' THEN ${paymentMilestones.amount} ELSE 0::numeric END), 0::numeric)`,
    due: sql<number>`COALESCE(SUM(CASE WHEN ${paymentMilestones.status} IN ('due', 'invoiced') THEN ${paymentMilestones.amount} ELSE 0::numeric END), 0::numeric)`,
  }).from(paymentMilestones).where(and(eq(paymentMilestones.projectId, projectId), isNull(paymentMilestones.deletedAt)));

  const collected = Number(pmStats?.collected || 0);
  const due = Number(pmStats?.due || 0);

  return {
    boardStatus: board.map(c => ({ name: c.name, count: c.tasks.length })),
    timeLogged: { totalHours, billableHours },
    financials: { collected, due, budget: Number(project.budget || 0), currency: project.currency },
  };
}

export async function assignMember(projectId: string, input: any, actorUserId: string) {
  const [assignment] = await db.insert(projectAssignments).values({
    projectId,
    employeeId: input.employeeId,
    roleOnProject: input.roleOnProject || 'Team Member',
    allocationPct: input.allocationPct || '100',
    createdBy: actorUserId,
  }).returning();

  if (!assignment) throw new Error('Failed to assign member');

  await auditAction({
    userId: actorUserId,
    action: 'project.assign_member',
    module: 'projects',
    targetId: assignment.id,
    details: input,
  });

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  const [assignedUser] = await db.select().from(users).where(eq(users.employeeId, input.employeeId));
  
  if (assignedUser && project) {
    await sendNotification(assignedUser.id, {
      type: 'assignment',
      title: 'Project Assignment',
      body: `You have been assigned to project ${project.name} as ${input.roleOnProject || 'Team Member'}.`,
      relatedType: 'project',
      relatedId: project.id,
      channel: 'in_app'
    });
  }

  return assignment;
}
