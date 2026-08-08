import { db } from '../db/client';
import { leaveRequests, leaveBalances, employees } from '../db/schema/hr';
import { eq, and, sql } from 'drizzle-orm';
import { auditLogs } from '../db/schema/platform';
import { sendNotification } from './notification.service';
import { users } from '../db/schema/identity';
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
  if (scope === 'own') {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, currentEmployeeId));
  }
  return await db.select().from(leaveRequests);
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
    throw new Error('No leave balance found for this type in the current year');
  }

  const requestedDays = parseFloat(input.days);
  const availableDays = parseFloat(balance.balanceDays);

  if (requestedDays > availableDays) {
    throw new Error('Insufficient leave balance');
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
    throw new Error('Failed to create leave request');
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

export async function decideLeaveRequest(id: string, decision: 'approved' | 'rejected', approverEmployeeId: string, actorUserId: string) {
  const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error('Request already decided');

  const updated = await db.transaction(async (tx) => {
    const [updatedReq] = await tx.update(leaveRequests).set({
      status: decision,
      approverId: approverEmployeeId,
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
