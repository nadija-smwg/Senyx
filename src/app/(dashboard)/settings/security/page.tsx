'use client';
import { ShieldCheck, Activity, Lock } from 'lucide-react';
import Link from 'next/link';
import {
    SettingsPageShell,
    SettingsNav,
    SettingsGridLayout,
    SettingsSectionCard,
    SettingsFooterLink,
    SettingsStatusPill,
} from '@/components/settings/settings-shell';

export default function SecuritySettingsPage() {
    return (
        <SettingsPageShell
            pretitle="Workspace"
            title="Security"
            description="Authentication, sessions, and password policies for your workspace."
        >
            <SettingsGridLayout nav={<SettingsNav />}>
                <SettingsSectionCard
                    title="Authentication"
                    description="Sign-in methods and session behavior."
                    icon={<ShieldCheck />}
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900">Supabase Authentication</p>
                                <p className="text-[11px] text-gray-500">Email + password sign-in is enforced.</p>
                            </div>
                            <SettingsStatusPill tone="positive">Enabled</SettingsStatusPill>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                                <p className="text-[11px] text-gray-500">Managed per user from the Profile section.</p>
                            </div>
                            <SettingsStatusPill tone="warning">Optional</SettingsStatusPill>
                        </div>
                    </div>
                </SettingsSectionCard>

                <SettingsSectionCard
                    title="Session Activity"
                    description="Inspect and revoke active sessions across devices."
                    icon={<Activity />}
                    footer={<SettingsFooterLink href="/audit/sessions">View session log</SettingsFooterLink>}
                >
                    <p className="text-sm text-gray-600">
                        Active sessions are recorded automatically by the existing{' '}
                        <span className="font-mono text-[12px] text-gray-800">/api/sessions</span> endpoints.
                        Use the link below to manage them.
                    </p>
                </SettingsSectionCard>

                <SettingsSectionCard
                    title="Password Policy"
                    description="Requirements enforced when users change their password."
                    icon={<Lock />}
                >
                    <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                        <li>Minimum 8 characters</li>
                        <li>Mix of letters and numbers recommended</li>
                        <li>Stored hashed via Supabase authentication</li>
                    </ul>
                    <p className="mt-3 text-xs text-gray-500">
                        Need to change your own password?{' '}
                        <Link href="/settings/profile" className="font-semibold text-[#7F4D9F] hover:text-[#5E3B7A]">
                            Go to Profile →
                        </Link>
                    </p>
                </SettingsSectionCard>
            </SettingsGridLayout>
        </SettingsPageShell>
    );
}