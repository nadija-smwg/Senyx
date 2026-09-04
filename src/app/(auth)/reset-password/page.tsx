'use client';
import { useState } from 'react';
import { fetchClient } from '../../../lib/api-client';
import {
  AuthLayout,
  AuthCard,
  AuthHeader,
  AuthField,
  AuthInput,
  AuthSubmitButton,
  AuthBanner,
  AuthAside,
  AuthBackLink,
} from '../../../components/auth/auth-shell';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password !== confirm) {
      setErrorMsg('Passwords do not match');
      setStatus('error');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      await fetchClient('/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMsg(error.message || 'Failed to reset password');
    }
  };

  return (
    <AuthLayout aside={<AuthAside />}>
      <AuthCard>
        <AuthHeader
          title="Set new password"
          subtitle="Enter a strong password of at least 8 characters."
        />

        {status === 'success' ? (
          <div className="space-y-4">
            <AuthBanner tone="success">
              Your password has been reset successfully. You can now sign in with your new password.
            </AuthBanner>
            <AuthBackLink href="/login">Back to sign in</AuthBackLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {status === 'error' && errorMsg && (
              <AuthBanner tone="error">{errorMsg}</AuthBanner>
            )}

            <AuthField htmlFor="password" label="New password">
              <AuthInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={status === 'loading'}
              />
            </AuthField>

            <AuthField htmlFor="confirm" label="Confirm password">
              <AuthInput
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={status === 'loading'}
              />
            </AuthField>

            <div className="pt-1">
              <AuthSubmitButton isLoading={status === 'loading'}>
                Reset password
              </AuthSubmitButton>
            </div>

            <div className="pt-1 text-center">
              <AuthBackLink href="/login">Back to sign in</AuthBackLink>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
