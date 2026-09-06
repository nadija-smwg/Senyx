'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchClient } from '@/lib/api-client';
import {
  AuthLayout,
  AuthCard,
  AuthField,
  AuthInput,
  AuthBanner,
} from '@/components/auth/auth-shell';
import { cn } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Password strength calculation                                       */
/* ------------------------------------------------------------------ */

type Strength = 'weak' | 'fair' | 'good' | 'strong';

function calcStrength(password: string): { level: Strength; score: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', score };
  if (score <= 4) return { level: 'fair', score };
  if (score <= 5) return { level: 'good', score };
  return { level: 'strong', score };
}

const STRENGTH_CONFIG: Record<Strength, { label: string; color: string; width: string }> = {
  weak:   { label: 'Weak',   color: 'bg-rose-500',    width: 'w-1/4' },
  fair:   { label: 'Fair',   color: 'bg-amber-500',   width: 'w-2/4' },
  good:   { label: 'Good',   color: 'bg-blue-500',    width: 'w-3/4' },
  strong: { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' },
};

/* ------------------------------------------------------------------ */
/*  Page component                                                      */
/* ------------------------------------------------------------------ */

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const strength = useMemo(() => calcStrength(password), [password]);
  const strengthCfg = STRENGTH_CONFIG[strength.level];

  const validations = useMemo(() => ({
    minLength: password.length >= 12,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);

  const canSubmit =
    validations.minLength &&
    validations.hasUpper &&
    validations.hasLower &&
    validations.hasDigit &&
    validations.hasSpecial &&
    validations.match &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await fetchClient('/api/auth/force-change-password', {
        method: 'POST',
        body: JSON.stringify({ password, confirmPassword }),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthCard>
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Updated</h1>
            <p className="text-sm text-gray-500 mb-8">
              Your account is now secured with your new password.<br />
              Welcome to SENYX.
            </p>
            <button
              onClick={() => router.push('/')}
              className={cn(
                'w-full h-11 rounded-xl text-sm font-semibold text-white',
                'bg-[#1A6DB6] hover:bg-[#155A96]',
                'shadow-[0_4px_16px_-4px_rgba(26,109,182,0.4)]',
                'transition-all inline-flex items-center justify-center gap-2'
              )}
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <AuthCard>
        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A6DB6]/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#1A6DB6]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Secure Your Account</h1>
              <p className="text-xs text-gray-500">Set your permanent password</p>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-cyan-50/40 px-4 py-3 mb-6">
          <p className="text-xs leading-relaxed text-blue-800">
            You are signing in with a temporary password. For security, you must create a new
            password before continuing. Your temporary password will no longer work after this change.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <AuthBanner tone="error">{error}</AuthBanner>
          )}

          {/* New Password */}
          <AuthField htmlFor="new-password" label="New Password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <AuthInput
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 12 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </AuthField>

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="space-y-2">
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    strengthCfg.color,
                    strengthCfg.width
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-[11px] font-semibold',
                  strength.level === 'weak' && 'text-rose-600',
                  strength.level === 'fair' && 'text-amber-600',
                  strength.level === 'good' && 'text-blue-600',
                  strength.level === 'strong' && 'text-emerald-600',
                )}>
                  {strengthCfg.label}
                </span>
              </div>

              {/* Requirements checklist */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                {[
                  { ok: validations.minLength, label: '12+ characters' },
                  { ok: validations.hasUpper, label: 'Uppercase letter' },
                  { ok: validations.hasLower, label: 'Lowercase letter' },
                  { ok: validations.hasDigit, label: 'Number' },
                  { ok: validations.hasSpecial, label: 'Special character' },
                ].map(({ ok, label }) => (
                  <div key={label} className={cn('flex items-center gap-1.5', ok ? 'text-emerald-600' : 'text-gray-400')}>
                    <CheckCircle2 className={cn('w-3 h-3', ok ? 'opacity-100' : 'opacity-40')} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <AuthField htmlFor="confirm-password" label="Confirm New Password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <AuthInput
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(s => !s)}
                disabled={isLoading}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !validations.match && (
              <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
            )}
          </AuthField>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'group relative w-full h-11 rounded-xl text-sm font-semibold text-white',
                'bg-[#1A6DB6] hover:bg-[#155A96]',
                'shadow-[0_4px_16px_-4px_rgba(26,109,182,0.4)]',
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#22BFE8]/40 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2'
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Updating…' : 'Set New Password & Continue'}</span>
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Your password is stored securely and never visible to administrators.
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
