import { useEffect, useState } from 'react';
import { fetchClient } from '../lib/api-client';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  roles: string[];
  permissions: any[];
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    roles: [],
    permissions: [],
    isLoading: true,
  });
  const router = useRouter();

  useEffect(() => {
    fetchClient<{ user: User, roles: string[], permissions: any[] }>('/api/auth/me')
      .then(data => {
        setAuthState({
          user: data.user,
          roles: data.roles,
          permissions: data.permissions,
          isLoading: false,
        });
      })
      .catch(() => {
        setAuthState({
          user: null,
          roles: [],
          permissions: [],
          isLoading: false,
        });
      });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await fetchClient<{ user: User, token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // In a full implementation, you might save the token or wait for cookie.
    // Re-fetch 'me' or just set state.
    router.push('/');
    return data;
  };

  const logout = async () => {
    await fetchClient('/api/auth/logout', { method: 'POST' });
    setAuthState({ user: null, roles: [], permissions: [], isLoading: false });
    router.push('/login');
  };

  return { ...authState, login, logout };
}
