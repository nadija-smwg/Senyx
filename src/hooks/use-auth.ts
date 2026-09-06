'use client';

import { useEffect, useState } from 'react';
import { fetchClient } from '../lib/api-client';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  roles: string[];
  permissions: { module: string; action: string; scope: string }[];
  mustChangePassword: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    roles: [],
    permissions: [],
    mustChangePassword: false,
    isLoading: true,
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchClient<{ user: User, roles: string[], permissions: any[], mustChangePassword?: boolean }>('/api/auth/me')
      .then(data => {
        const mustChange = data.mustChangePassword ?? false;
        setAuthState({
          user: data.user,
          roles: data.roles,
          permissions: data.permissions,
          mustChangePassword: mustChange,
          isLoading: false,
        });

        // If user must change password and is NOT on the change-password page, redirect
        if (mustChange && pathname !== '/change-password') {
          router.replace('/change-password');
        }
      })
      .catch(() => {
        setAuthState({
          user: null,
          roles: [],
          permissions: [],
          mustChangePassword: false,
          isLoading: false,
        });
      });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await fetchClient<{ user: User, token: string, mustChangePassword?: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // If the user must change their temporary password, redirect to change-password
    if (data.mustChangePassword) {
      router.push('/change-password');
    } else {
      router.push('/');
    }

    return data;
  };

  const logout = async () => {
    try {
      await fetchClient('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      setAuthState({ user: null, roles: [], permissions: [], mustChangePassword: false, isLoading: false });
      router.push('/login');
    }
  };

  return { ...authState, login, logout };
}
