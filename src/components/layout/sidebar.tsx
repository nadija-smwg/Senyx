'use client';

import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getNavGroups, isItemActive } from './nav-config';

export function Sidebar() {
  const { roles } = useAuth();
  const pathname = usePathname();

  const isAdminOrHR = roles.includes('Admin') || roles.includes('HR Manager');
  const navGroups = useMemo(() => getNavGroups(isAdminOrHR), [isAdminOrHR]);

  return (
    <aside
      className="hidden md:flex w-[256px] h-screen flex-col shrink-0 z-20 bg-white border-r border-[#E5E7EB]"
    >
      {/* Brand — original Senyx logo (icon + wordmark) */}
      <div className="h-[80px] flex items-center px-4 shrink-0 border-b border-[#E5E7EB]">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo-icon-transparent.png"
            alt="Senyx Icon"
            className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col justify-center leading-tight">
            <img
              src="/name-transparent.png"
              alt="SENYX"
              className="h-9 object-contain object-left"
            />
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#1A6DB6] mt-0.5">
              ERP Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn('space-y-1', groupIndex > 0 && 'mt-6')}>
            <h3 className="px-3 mb-1.5 flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: group.color }}
                aria-hidden
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {group.label}
              </span>
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-2.5 h-9 pl-3 pr-2.5 rounded-lg text-[13px] font-medium',
                      'transition-all duration-150 ease-out outline-none',
                      'focus-visible:ring-2 focus-visible:ring-[#22BFE8]/40 focus-visible:ring-offset-1',
                      !active && 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    style={
                      active
                        ? {
                          backgroundColor: group.bg,
                          color: group.color,
                          boxShadow: `inset 3px 0 0 ${group.color}`,
                        }
                        : undefined
                    }
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-all duration-150',
                        active ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'
                      )}
                      style={{ color: group.color }}
                    />
                    <span className={cn('flex-1 truncate', active && 'font-semibold')}>
                      {item.label}
                    </span>
                    {active && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                        aria-hidden
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 shrink-0 flex items-center justify-between border-t border-[#E5E7EB]">
        <div className="text-[10px] font-mono text-gray-400 tracking-wide">Senyx v1.0</div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] font-semibold text-gray-500">
            Operational
          </span>
        </div>
      </div>
    </aside>
  );
}
