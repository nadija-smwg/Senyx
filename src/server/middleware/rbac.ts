import { AuthContext } from '../types/context';
import { ForbiddenError } from '../types/errors';

export function requirePermission(module: string, action: string, requiredScope?: string) {
  return (ctx: AuthContext) => {
    const perm = ctx.permissions.find(p => p.module === module && p.action === action);
    
    if (!perm) {
      throw new ForbiddenError(`Missing permission: ${action} on ${module}`);
    }

    if (requiredScope && perm.scope !== 'all' && perm.scope !== requiredScope) {
      throw new ForbiddenError(`Insufficient scope for ${action} on ${module}`);
    }

    return perm.scope; // returns 'all', 'own', 'assigned'
  };
}

export function hasAnyRole(ctx: AuthContext, ...roleNames: string[]): boolean {
  return ctx.roles.some(role => roleNames.includes(role));
}

export function isAdmin(ctx: AuthContext): boolean {
  return hasAnyRole(ctx, 'Admin');
}
