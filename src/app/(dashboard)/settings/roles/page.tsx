'use client';
import { useState, useEffect } from 'react';
import {
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import { RoleForm } from '@/components/settings/role-form';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export default function RolesListPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = () => {
    setIsLoading(true);
    fetchClient<{ data: Role[] }>('/api/roles')
      .then(res => {
        setRoles(res.data);
        setError(null);
      })
      .catch(e => {
        setError(e?.message || 'Failed to load roles');
        toast.error('Failed to load roles');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoles();
  }, []);

  const systemCount = roles.filter(r => r.isSystem).length;
  const customCount = roles.length - systemCount;

  return (
    <SettingsPageShell
      pretitle="Workspace"
      title="Roles & Permissions"
      description="Define roles and access-control matrices used across the platform."
      stats={
        <>
          <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-4 py-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-[#F3EEF8] text-[#7F4D9F] flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]">
              <KeyRound />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Total Roles</p>
              <p className="text-2xl font-bold font-heading text-gray-900 tabular-nums leading-tight">
                {roles.length}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-4 py-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-[#F3EEF8] text-[#7F4D9F] flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]">
              <ShieldCheck />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">System Roles</p>
              <p className="text-2xl font-bold font-heading text-gray-900 tabular-nums leading-tight">
                {systemCount}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-4 py-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-[#F3EEF8] text-[#7F4D9F] flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]">
              <Plus />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Custom Roles</p>
              <p className="text-2xl font-bold font-heading text-gray-900 tabular-nums leading-tight">
                {customCount}
              </p>
            </div>
          </div>
        </>
      }
      actions={
        <Sheet>
          <SheetTrigger asChild>
            <Button className="gap-1.5 bg-[#7F4D9F] hover:bg-[#5E3B7A] text-white shadow-sm">
              <Plus className="w-4 h-4" />
              Create Role
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[480px] overflow-hidden flex flex-col p-0">
            <SheetHeader className="px-6 py-6 border-b shrink-0">
              <SheetTitle>Create New Role</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 relative h-full">
              <RoleForm onSuccess={fetchRoles} />
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <SettingsGridLayout nav={<SettingsNav />}>
        <SettingsSectionCard
          title="Roles"
          description="Click a role to manage its permissions matrix."
          icon={<KeyRound />}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading roles…
            </div>
          ) : error ? (
            <div className="text-sm text-rose-600 py-6">{error}</div>
          ) : roles.length === 0 ? (
            <p className="text-sm text-gray-500 py-6">No roles defined yet. Create the first one.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map(role => (
                <Link
                  key={role.id}
                  href={`/settings/roles/${role.id}`}
                  className="rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-[#F3EEF8] hover:border-[#D9C7E5] p-4 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{role.name}</p>
                    {role.isSystem && <SettingsStatusPill tone="info">System</SettingsStatusPill>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2.5rem]">
                    {role.description || 'No description provided.'}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <span className="text-[11px] font-semibold text-[#7F4D9F] group-hover:text-[#5E3B7A] transition-colors">
                      Edit permissions →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SettingsSectionCard>
      </SettingsGridLayout>
    </SettingsPageShell>
  );
}
