'use client';

/**
 * Client-side settings sidebar nav. Kept separate from `settings-shell.tsx`
 * because the shell must be a server-friendly module (the index page is a
 * server component that maps over `SETTINGS_SECTIONS`). This file owns
 * the only client-only dependency: reading the current pathname.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SETTINGS_SECTIONS, type SettingsSection } from './settings-shell';
import { useAuth } from '@/hooks/use-auth';

export interface SettingsNavProps {
    /** Override the default sections (mostly used to hide items not yet implemented). */
    sections?: SettingsSection[];
}

export function SettingsNav({ sections = SETTINGS_SECTIONS }: SettingsNavProps) {
    const pathname = usePathname();
    const { roles } = useAuth();
    const isAdmin = roles.includes('Admin');

    const visibleSections = sections.filter(s => {
        if (!s.visibleTo) return true;
        if (isAdmin) return true;
        return s.visibleTo.some(r => roles.includes(r));
    });

    return (
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Settings</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">Manage your workspace</p>
            </div>
            <ul className="p-1.5">
                {visibleSections.map(s => {
                    const active = pathname === s.href || pathname?.startsWith(s.href + '/');
                    const Icon = s.icon;
                    return (
                        <li key={s.id}>
                            <Link
                                href={s.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
                                    active
                                        ? 'bg-[#F3EEF8] text-[#5E3B7A]'
                                        : 'text-gray-700 hover:bg-gray-50'
                                )}
                            >
                                <span
                                    className={cn(
                                        'mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4',
                                        active
                                            ? 'bg-[#7F4D9F] text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-[#F3EEF8] group-hover:text-[#7F4D9F]'
                                    )}
                                >
                                    <Icon />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold truncate">{s.label}</span>
                                    <span
                                        className={cn(
                                            'block text-[11px] mt-0.5 truncate',
                                            active ? 'text-[#5E3B7A]/80' : 'text-gray-400'
                                        )}
                                    >
                                        {s.description}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}