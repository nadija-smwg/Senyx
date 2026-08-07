import { db } from '../db/client';
import { roles, permissions, rolePermissions } from '../db/schema/identity';
import { eq } from 'drizzle-orm';
import { AuthContext } from '../types/context';
import { withAudit } from '../lib/with-audit';
import { NotFoundError, BusinessRuleError } from '../types/errors';

export class RbacService {
  async listRoles() {
    return await db.select().from(roles);
  }

  async getRole(id: string) {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    if (!role) throw new NotFoundError('Role not found');

    const perms = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));

    return { ...role, permissions: perms.map(p => p.permission) };
  }

  async createRole(ctx: AuthContext, input: { name: string; description?: string }) {
    return await withAudit(ctx, 'role.create', 'role', null, async (tx) => {
      const [role] = await tx
        .insert(roles)
        .values({ name: input.name, description: input.description })
        .returning();
      return { result: role, after: role };
    });
  }

  async updateRole(ctx: AuthContext, id: string, input: { name?: string; description?: string }) {
    return await withAudit(ctx, 'role.update', 'role', id, async (tx) => {
      const [existing] = await tx.select().from(roles).where(eq(roles.id, id));
      if (!existing) throw new NotFoundError('Role not found');
      if (existing.isSystem) throw new BusinessRuleError('Cannot modify system roles');

      const [role] = await tx
        .update(roles)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(roles.id, id))
        .returning();
      return { result: role, before: existing, after: role };
    });
  }

  async deleteRole(ctx: AuthContext, id: string) {
    return await withAudit(ctx, 'role.delete', 'role', id, async (tx) => {
      const [existing] = await tx.select().from(roles).where(eq(roles.id, id));
      if (!existing) throw new NotFoundError('Role not found');
      if (existing.isSystem) throw new BusinessRuleError('Cannot delete system roles');

      await tx.delete(roles).where(eq(roles.id, id));
      return { result: true, before: existing };
    });
  }

  async listPermissions() {
    return await db.select().from(permissions);
  }
}

export const rbacService = new RbacService();

