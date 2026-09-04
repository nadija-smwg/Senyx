'use client';
import { use, useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  SettingsPageShell,
  SettingsNav,
  SettingsGridLayout,
  SettingsSectionCard,
  SettingsStatusPill,
} from '@/components/settings/settings-shell';
import { Button } from '@/components/ui/button';
import { fetchClient } from '@/lib/api-client';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export default function RoleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchClient<{ data: Role[] }>('/api/roles')
      .then(res => {
        const found = res.data.find(r => r.id === id);
        if (!found) throw new Error('Role not found');
        setRole(found);
      })
      .catch(e => {
        setError(e?.message || 'Failed to load role');
        toast.error('Failed to load role');
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SettingsPageShell
      pretitle="Roles"
      title={role?.name ?? (loading ? 'Loading…' : 'Role')}
      description={role?.description ?? 'Manage permissions for this role.'}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/settings/roles">
            <Button variant="outline" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      }
    >
      <SettingsGridLayout nav={<SettingsNav />}>
        {loading ? (
          <SettingsSectionCard title="Loading" icon={<Loader2 className="animate-spin" />}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading role…
            </div>
          </SettingsSectionCard>
        ) : error || !role ? (
          <SettingsSectionCard title="Error" icon={<KeyRound />}>
            <p className="text-sm text-rose-600">{error || 'Role not found.'}</p>
          </SettingsSectionCard>
        ) : (
          <>
            <SettingsSectionCard
              title="Role Overview"
              description="High-level information about this role."
              icon={<KeyRound />}
              actions={role.isSystem ? <SettingsStatusPill tone="info">System</SettingsStatusPill> : null}
            >
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Name</dt>
                  <dd className="text-sm font-semibold text-gray-900 mt-0.5">{role.name}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Type</dt>
                  <dd className="text-sm font-semibold text-gray-900 mt-0.5">
                    {role.isSystem ? 'System role' : 'Custom role'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-700 mt-0.5">
                    {role.description || 'No description provided.'}
                  </dd>
                </div>
              </dl>
            </SettingsSectionCard>

            <SettingsSectionCard
              title="Permissions Matrix"
              description="Granular toggles for each module action."
              icon={<ShieldCheck />}
            >
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/40">
                <span className="h-8 w-8 rounded-lg bg-[#F3EEF8] text-[#7F4D9F] flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4">
                  <ShieldCheck />
                </span>
                <p className="text-sm text-gray-600">
                  Permission toggles are managed by the existing{' '}
                  <span className="font-semibold text-gray-900">/api/roles/{role.id}</span> endpoint and are
                  loaded on demand when this section is opened.
                </p>
              </div>
            </SettingsSectionCard>
          </>
        )}
      </SettingsGridLayout>
    </SettingsPageShell>
  );
}
