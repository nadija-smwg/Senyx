import { db } from '../db/client';
import { leaveRequests, leaveBalances, employees, leaveTypes, departments } from '../db/schema/hr';
import { eq, and, sql } from 'drizzle-orm';
import { auditLogs } from '../db/schema/platform';
import { sendNotification } from './notification.service';
import { users } from '../db/schema/identity';
import { AppError } from '../types/errors';
async function auditAction(data: any) {
  try {
    await db.insert(auditLogs).values({
      actorId: data.userId || null,
      action: data.action,
      apiRoute: '/api/leave-requests',
      entityType: data.module,
      entityId: data.targetId || null,
      result: 'success',
      after: data.details,
      ipAddress: data.ipAddress,
    });
  } catch (e) {
    console.error("Failed to insert audit log", e);
  }
}

export async function listLeaveRequests(scope: 'all' | 'own', currentEmployeeId: string) {
  const query = db
    .select({
      id: leaveRequests.id,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      days: leaveRequests.days,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      approverId: leaveRequests.approverId,
      decidedAt: leaveRequests.decidedAt,
      createdAt: leaveRequests.createdAt,
      employeeId: leaveRequests.employeeId,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      employeeCode: employees.employeeCode,
      departmentName: departments.name,
      leaveTypeName: leaveTypes.name,
      leaveTypeId: leaveRequests.leaveTypeId,
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id));

  if (scope === 'own') {
    return await query.where(eq(leaveRequests.employeeId, currentEmployeeId));
  }
  return await query;
}

export async function createLeaveRequest(input: {
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  days: string; // Numeric string
  reason?: string;
}, actorUserId: string) {
  // Validate days <= balance
  const currentYear = new Date(input.startDate).getFullYear();
  const [balance] = await db.select().from(leaveBalances).where(
    and(
      eq(leaveBalances.employeeId, input.employeeId),
      eq(leaveBalances.leaveTypeId, input.leaveTypeId),
      eq(leaveBalances.year, currentYear)
    )
  );

  if (!balance) {
    throw new AppError('No leave balance found for this leave type in the current year. Please contact HR.', 422, 'NO_BALANCE');
  }

  const requestedDays = parseFloat(input.days);
  const availableDays = parseFloat(balance.balanceDays);

  if (requestedDays > availableDays) {
    throw new AppError(`Insufficient leave balance. You have ${availableDays} day(s) available.`, 422, 'INSUFFICIENT_BALANCE');
  }

  const [request] = await db.insert(leaveRequests).values({
    employeeId: input.employeeId,
    leaveTypeId: input.leaveTypeId,
    startDate: input.startDate,
    endDate: input.endDate,
    days: input.days,
    reason: input.reason,
    status: 'pending',
  }).returning();

  if (!request) {
    throw new AppError('Failed to create leave request', 500, 'CREATE_FAILED');
  }

  await auditAction({
    userId: actorUserId,
    action: 'leave.request',
    module: 'hr',
    targetId: request.id,
    ipAddress: '127.0.0.1',
    details: { days: input.days, type: input.leaveTypeId },
  });

  const [employeeInfo] = await db.select().from(employees).where(eq(employees.id, input.employeeId));
  if (employeeInfo && employeeInfo.managerId) {
    const [managerUser] = await db.select().from(users).where(eq(users.employeeId, employeeInfo.managerId));
    if (managerUser) {
      await sendNotification(managerUser.id, {
        type: 'approval_request',
        title: 'Leave Request Pending',
        body: `${employeeInfo.firstName} ${employeeInfo.lastName} has submitted a leave request.`,
        relatedType: 'leave_request',
        relatedId: request.id,
        channel: 'in_app',
        templateName: 'approval-request',
        templateVariables: { target: `Leave Request for ${employeeInfo.firstName} ${employeeInfo.lastName}` }
      });
    }
  }

  return request;
}

export async function decideLeaveRequest(id: string, decision: 'approved' | 'rejected', approverEmployeeId: string, actorUserId: string, approverComment?: string) {
  const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
  if (!request) throw new AppError('Request not found', 404, 'NOT_FOUND');
  if (request.status !== 'pending') throw new AppError('Request already decided', 400, 'BAD_REQUEST');

  const updated = await db.transaction(async (tx) => {
    const [updatedReq] = await tx.update(leaveRequests).set({
      status: decision,
      approverId: approverEmployeeId,
      approverComment: approverComment || null,
      decidedAt: new Date(),
    }).where(eq(leaveRequests.id, id)).returning();

    if (decision === 'approved') {
      const currentYear = new Date(request.startDate).getFullYear();
      await tx.update(leaveBalances)
        .set({
          balanceDays: sql`${leaveBalances.balanceDays} - ${parseFloat(request.days)}`,
        })
        .where(
          and(
            eq(leaveBalances.employeeId, request.employeeId),
            eq(leaveBalances.leaveTypeId, request.leaveTypeId),
            eq(leaveBalances.year, currentYear)
          )
        );
    }
    return updatedReq;
  });

  await auditAction({
    userId: actorUserId,
    action: `leave.${decision}`,
    module: 'hr',
    targetId: request.id,
    ipAddress: '127.0.0.1',
    details: { decision },
  });

  const [employeeUser] = await db.select().from(users).where(eq(users.employeeId, request.employeeId));
  if (employeeUser) {
    await sendNotification(employeeUser.id, {
      type: 'status_update',
      title: 'Leave Request Decided',
      body: `Your leave request has been ${decision}.`,
      relatedType: 'leave_request',
      relatedId: request.id,
      channel: 'in_app',
      templateName: 'status-update',
      templateVariables: { target: 'Leave Request', status: decision }
    });
  }

  return updated;
}

export async function getLeaveBalances(employeeId: string) {
  return await db.select().from(leaveBalances).where(eq(leaveBalances.employeeId, employeeId));
}
