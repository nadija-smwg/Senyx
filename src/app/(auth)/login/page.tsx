'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/use-auth';
import {
  AuthLayout,
  AuthCard,
  AuthHeader,
  AuthField,
  AuthInput,
  AuthSubmitButton,
  AuthBanner,
  AuthAside,
  Lock,
  Mail,
} from '../../../components/auth/auth-shell';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout aside={<AuthAside />}>
      <AuthCard>
        <AuthHeader
          title="Welcome back"
          subtitle="Sign in to your Senyx workspace to continue."
        />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <AuthBanner tone="error">{error}</AuthBanner>
          )}

          <AuthField htmlFor="email" label="Email address">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <AuthInput
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </AuthField>

          <AuthField htmlFor="password" label="Password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <AuthInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </AuthField>

          <div className="flex items-center justify-end pt-0.5">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#1A6DB6] hover:text-[#155A96] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <div className="pt-2">
            <AuthSubmitButton isLoading={isLoading}>Sign in</AuthSubmitButton>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          By signing in you agree to your workspace's{' '}
          <span className="font-semibold text-gray-600">acceptable-use policy</span>.
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
