'use client';

import { useAuth } from './use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function usePermissions() {
  const { permissions } = useAuth();

  const hasPermission = (module: string, action: string, requiredScope?: string) => {
    const perm = permissions.find((p: any) => p.module === module && p.action === action);
    if (!perm) return false;
    if (requiredScope && perm.scope !== 'all' && perm.scope !== requiredScope) return false;
    return true;
  };

  return { hasPermission };
}

export function useRequirePermission(module: string, action: string) {
  const { hasPermission } = usePermissions();
  const { isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (!hasPermission(module, action)) {
        router.replace('/unauthorized');
      }
    }
  }, [isLoading, user, module, action, hasPermission, router]);
}
