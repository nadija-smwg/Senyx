import { db } from '../db/client';
import { changeRequests } from '../db/schema/platform';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { NotFoundError } from '../types/errors';
import { withAudit } from '../lib/with-audit';
import { AuthContext } from '../types/context';

export async function listChangeRequests(employeeId?: string) {
  const query = db
    .select()
    .from(changeRequests)
    .orderBy(desc(changeRequests.createdAt));
  
  if (employeeId) {
    return await query.where(and(isNull(changeRequests.deletedAt), eq(changeRequests.employeeId, employeeId)));
  }

  return await query.where(isNull(changeRequests.deletedAt));
}

export async function getChangeRequest(id: string, employeeId?: string) {
  let conditions = and(eq(changeRequests.id, id), isNull(changeRequests.deletedAt));
  
  if (employeeId) {
    conditions = and(conditions, eq(changeRequests.employeeId, employeeId));
  }

  const [request] = await db
    .select()
    .from(changeRequests)
    .where(conditions);
    
  if (!request) {
    throw new NotFoundError('Change request not found');
  }
  return request;
}

export async function createChangeRequest(data: { employeeId: string; title: string; description: string }) {
  const [request] = await db.insert(changeRequests).values(data).returning();
  return request;
}

export async function updateChangeRequestStatus(
  ctx: AuthContext,
  id: string,
  data: { status: string; adminComment?: string; reviewedBy: string }
) {
  return await withAudit(ctx, 'update_change_request_status', 'change_request', id, async (tx) => {
    const [existing] = await tx.select().from(changeRequests).where(eq(changeRequests.id, id));
    if (!existing) {
      throw new NotFoundError('Change request not found');
    }

    const [updated] = await tx
      .update(changeRequests)
      .set({
        status: data.status,
        adminComment: data.adminComment,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(changeRequests.id, id))
      .returning();

    return {
      result: updated,
      before: { status: existing.status, adminComment: existing.adminComment },
      after: { status: updated.status, adminComment: updated.adminComment },
    };
  });
}
