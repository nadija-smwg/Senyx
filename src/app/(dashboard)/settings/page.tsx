'use client';

import Link from 'next/link';
import { ArrowRight, Building2, KeyRound, ShieldCheck, UserCog } from 'lucide-react';
import {
  SettingsPageShell,
  SETTINGS_SECTIONS,
} from '@/components/settings/settings-shell';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsOverviewPage() {
  const { roles } = useAuth();
  const isAdmin = roles.includes('Admin');
  const visibleSections = SETTINGS_SECTIONS.filter(s => {
      if (!s.visibleTo) return true;
      if (isAdmin) return true;
      return s.visibleTo.some(r => roles.includes(r));
  });

  return (
    <SettingsPageShell
      pretitle="Workspace"
      title="Settings"
      description="Manage your workspace configuration, profile, authentication, and access control."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleSections.map(s => {
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                href={s.href}
                className="group bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-4 hover:border-[#D9C7E5] hover:shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="h-10 w-10 rounded-xl bg-[#F3EEF8] text-[#7F4D9F] flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]">
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.label}</p>
                      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-[#7F4D9F] transition-colors" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {isAdmin && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Tip</p>
              <p className="text-sm text-gray-700 mt-1">
                Changes to <span className="font-semibold">Roles & Permissions</span> and
                <span className="font-semibold"> General</span> settings apply workspace-wide immediately.
                Use the sidebar to jump to any section.
              </p>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#7F4D9F]" />
                <span>Company, currency and reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCog className="w-3.5 h-3.5 text-[#7F4D9F]" />
                <span>Your profile and password</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7F4D9F]" />
                <span>Authentication and sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-[#7F4D9F]" />
                <span>Roles & permission matrices</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </SettingsPageShell>
  );
}
