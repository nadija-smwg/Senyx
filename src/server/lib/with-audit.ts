import { db } from '../db/client';
import { auditLogs } from '../db/schema/platform';
import { AuthContext } from '../types/context';
import { logger } from './logger';

export interface AuditOperationResult<T> {
  result: T;
  before?: any;
  after?: any;
}

export async function withAudit<T>(
  ctx: AuthContext,
  action: string,
  entityType: string,
  entityId: string | null,
  operation: (tx: any) => Promise<AuditOperationResult<T>>
): Promise<T> {
  let operationResult: AuditOperationResult<T> | undefined;
  let error: any = null;

  try {
    operationResult = await db.transaction(async (tx) => {
      const res = await operation(tx);

      await tx.insert(auditLogs).values({
        actorId: ctx.userId,
        roleInEffect: ctx.roles.length > 0 ? ctx.roles[0] : null, // Simplification
        sessionId: ctx.sessionId === 'temp-session' ? null : ctx.sessionId,
        action,
        apiRoute: ctx.apiRoute,
        entityType,
        entityId,
        before: res.before || null,
        after: res.after || null,
        device: ctx.deviceInfo.device,
        os: ctx.deviceInfo.os,
        browser: ctx.deviceInfo.browser,
        ipAddress: ctx.ip,
        result: 'success',
      });

      return res;
    });

    return operationResult!.result;
  } catch (err: any) {
    error = err;
    
    // Log failure
    try {
      await db.insert(auditLogs).values({
        actorId: ctx.userId,
        roleInEffect: ctx.roles.length > 0 ? ctx.roles[0] : null,
        sessionId: ctx.sessionId === 'temp-session' ? null : ctx.sessionId,
        action,
        apiRoute: ctx.apiRoute,
        entityType,
        entityId,
        device: ctx.deviceInfo.device,
        os: ctx.deviceInfo.os,
        browser: ctx.deviceInfo.browser,
        ipAddress: ctx.ip,
        result: 'failure',
        errorCode: err.code || err.name || 'UNKNOWN',
      });
    } catch (auditErr) {
      logger.error({ err: auditErr }, 'Failed to write audit log for failure');
    }

    throw error;
  }
}
