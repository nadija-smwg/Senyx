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
  Mail,
} from '../../../components/auth/auth-shell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      await fetchClient('/api/auth/password/reset-request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.message || 'Failed to send the reset link. Please try again.');
    }
  };

  return (
    <AuthLayout aside={<AuthAside />}>
      <AuthCard>
        <AuthHeader
          title="Reset your password"
          subtitle="Enter the email address associated with your account and we'll send a secure reset link."
        />

        {status === 'success' ? (
          <div className="space-y-4">
            <AuthBanner tone="success">
              Check your inbox at <strong>{email}</strong> for a password reset link. If it
              doesn't arrive within a few minutes, look in your spam folder.
            </AuthBanner>
            <AuthBackLink href="/login">Back to sign in</AuthBackLink>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {status === 'error' && errorMessage && (
              <AuthBanner tone="error">{errorMessage}</AuthBanner>
            )}

            <AuthField
              htmlFor="email"
              label="Email address"
              hint="We'll never share your email with anyone."
            >
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
                  disabled={status === 'loading'}
                  className="pl-10"
                />
              </div>
            </AuthField>

            <div className="pt-1">
              <AuthSubmitButton isLoading={status === 'loading'}>
                Send reset link
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
