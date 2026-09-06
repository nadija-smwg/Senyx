import { db } from '../db/client';
import { projectAssignments } from '../db/schema/projects';
import { eq, and, isNull } from 'drizzle-orm';
import { AuthContext } from '../types/context';
import { ForbiddenError, NotFoundError } from '../types/errors';
import { projects } from '../db/schema/projects';

/**
 * Returns true if the current user is an Admin or HR Manager.
 */
export function isAdminUser(ctx: AuthContext): boolean {
  return ctx.roles.includes('Admin') || ctx.roles.includes('HR Manager');
}

/**
 * Verifies the project exists and that the current user is allowed to access it.
 *
 * Admins: always allowed.
 * Employees: only allowed if they have an active (unassigned_at IS NULL) assignment.
 *
 * Throws ForbiddenError or NotFoundError if access is denied.
 */
export async function enforceProjectAccess(ctx: AuthContext, projectId: string): Promise<void> {
  // Admins can access all projects
  if (isAdminUser(ctx)) return;

  // Verify the project actually exists first
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));

  if (!project) {
    // Return 404 to not reveal project existence
    throw new NotFoundError('Project not found');
  }

  // Employee must have an active assignment
  if (!ctx.employeeId) {
    throw new ForbiddenError('Access denied: no employee profile linked to this account.');
  }

  const [assignment] = await db
    .select({ id: projectAssignments.id })
    .from(projectAssignments)
    .where(
      and(
        eq(projectAssignments.projectId, projectId),
        eq(projectAssignments.employeeId, ctx.employeeId),
        isNull(projectAssignments.unassignedAt)
      )
    );

  if (!assignment) {
    // Return 404 so the employee can't discover projects they are not assigned to
    throw new NotFoundError('Project not found');
  }
}

/**
 * Throws ForbiddenError if the current user is not an Admin.
 * Use this to protect admin-only write operations.
 */
export function requireAdmin(ctx: AuthContext): void {
  if (!isAdminUser(ctx)) {
    throw new ForbiddenError('Only administrators can perform this action.');
  }
}
