'use client';

import { useEffect, useState } from 'react';
import { Lock, Loader2, Mail, RefreshCw, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  SettingsPageShell,
  SettingsNav,
  SettingsGridLayout,
  SettingsSectionCard,
  SettingsField,
  SettingsInput,
  SettingsAvatar,
  SettingsStatusPill,
  SettingsSaveBar,
} from '@/components/settings/settings-shell';

type Me = { user: { firstName: string; lastName: string; email: string } };

export default function ProfileSettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data: Me = await res.json();
          setName(`${data.user.firstName} ${data.user.lastName}`.trim());
          setEmail(data.user.email);
        }
      } catch (e) {
        console.error('Failed to load profile', e);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const isDirty = password.length > 0;
  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ['Empty', 'Weak', 'Good', 'Strong'][passwordStrength];
  const strengthTone: 'negative' | 'warning' | 'positive' =
    passwordStrength <= 1 ? 'negative' : passwordStrength === 2 ? 'warning' : 'positive';

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!password) {
      setError('Enter a new password or leave the field blank to keep your current password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsPageShell
      pretitle="Workspace"
      title="Profile"
      description="Manage your personal account details and password."
    >
      <SettingsGridLayout nav={<SettingsNav />}>
        {isLoading ? (
          <SettingsSectionCard title="Loading" icon={<Loader2 className="animate-spin" />}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your profile…
            </div>
          </SettingsSectionCard>
        ) : (
          <>
            <SettingsSectionCard
              title="Account"
              description="Your identity inside this workspace."
              icon={<User />}
            >
              <div className="flex items-center gap-4">
                <SettingsAvatar name={name} />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-gray-900 truncate">{name || 'Unknown user'}</p>
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {email}
                  </p>
                  <div className="mt-1">
                    <SettingsStatusPill tone="positive">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </SettingsStatusPill>
                  </div>
                </div>
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="Personal Information"
              description="Read-only fields are managed by your administrator."
              icon={<User />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField label="Full Name" hint="Contact your admin to update your name.">
                  <SettingsInput value={name} onChange={e => setName(e.target.value)} disabled />
                </SettingsField>
                <SettingsField label="Email Address" hint="Verified at sign-in.">
                  <SettingsInput
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled
                  />
                </SettingsField>
              </div>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="Change Password"
              description="Use at least 8 characters with a mix of letters and numbers."
              icon={<Lock />}
              actions={isDirty ? <SettingsStatusPill tone={strengthTone}>{strengthLabel}</SettingsStatusPill> : null}
              footer={
                <SettingsSaveBar
                  isSaving={isSaving}
                  isDirty={isDirty}
                  onSave={() => handleSave()}
                  saveLabel="Update Password"
                />
              }
            >
              <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField
                  label="New Password"
                  required
                  hint={password.length > 0 ? `${password.length} characters` : undefined}
                >
                  <SettingsInput
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </SettingsField>
                <SettingsField
                  label="Confirm Password"
                  required
                  error={
                    confirmPassword && confirmPassword !== password
                      ? 'Passwords do not match.'
                      : undefined
                  }
                >
                  <SettingsInput
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </SettingsField>
                {error && (
                  <div className="sm:col-span-2">
                    <p className="text-[12px] text-rose-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> {error}
                    </p>
                  </div>
                )}
              </form>
            </SettingsSectionCard>
          </>
        )}
      </SettingsGridLayout>
    </SettingsPageShell>
  );
}
