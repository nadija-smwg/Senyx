/**
 * Shared Settings visual language.
 *
 * Mirrors the structure of crm-shell.tsx / finance-shell.tsx so the
 * Settings section feels consistent with the rest of Senyx. Pure
 * presentation only — no business logic is touched.
 *
 * NOTE: This file must NOT carry the `'use client'` directive. The
 * settings index page is a server component that imports the
 * `SETTINGS_SECTIONS` constant here and iterates with `.map`. Marking
 * this file as a client module turns every export into a serialisable
 * proxy, which is why the original implementation threw
 * `SETTINGS_SECTIONS.map is not a function` in production.
 */

import * as React from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    CircleDot,
    KeyRound,
    Lock,
    Settings as SettingsIcon,
    ShieldCheck,
    UserCog,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/* ------------------------------------------------------------------ */
/* Brand tokens                                                          */
/* ------------------------------------------------------------------ */

export const SETTINGS_BRAND = {
    primary: '#7F4D9F', // violet (matches the brand gradient stop in PageHeader)
    primaryTint: '#F3EEF8',
    deep: '#5E3B7A',
    border: '#D9C7E5',
} as const;

/* ------------------------------------------------------------------ */
/* Section metadata                                                     */
/* ------------------------------------------------------------------ */

export interface SettingsSection {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
    {
        id: 'general',
        label: 'General',
        description: 'Company info, defaults and reminders.',
        href: '/settings/general',
        icon: Building2,
    },
    {
        id: 'profile',
        label: 'Profile',
        description: 'Your personal account information and password.',
        href: '/settings/profile',
        icon: UserCog,
    },
    {
        id: 'security',
        label: 'Security',
        description: 'Authentication, sessions and password policies.',
        href: '/settings/security',
        icon: ShieldCheck,
    },
    {
        id: 'roles',
        label: 'Roles & Permissions',
        description: 'Manage user roles and access control matrices.',
        href: '/settings/roles',
        icon: KeyRound,
    },
];

/* ------------------------------------------------------------------ */
/* Settings page shell                                                  */
/* ------------------------------------------------------------------ */

interface SettingsPageShellProps {
    pretitle?: string;
    title: string;
    description?: string;
    actions?: React.ReactNode;
    /** Optional stat strip shown below the hero. */
    stats?: React.ReactNode;
    children: React.ReactNode;
}

export function SettingsPageShell({
    pretitle,
    title,
    description,
    actions,
    stats,
    children,
}: SettingsPageShellProps) {
    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[180%] rounded-[100%] bg-gradient-to-br from-[#7F4D9F]/12 via-[#5E3B7A]/8 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-60%] left-[-10%] w-[40%] h-[180%] rounded-[100%] bg-gradient-to-tr from-[#22BFE8]/10 via-[#1A6DB6]/8 to-transparent blur-3xl pointer-events-none" />
                <div className="relative px-5 sm:px-7 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                        {pretitle && (
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#7F4D9F] via-[#5E3B7A] to-[#22BFE8] bg-clip-text text-transparent">
                                {pretitle}
                            </p>
                        )}
                        <h1 className="mt-1 text-2xl font-extrabold font-heading text-gray-900 tracking-tight truncate">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
                </div>
            </div>

            {stats && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{stats}</div>}

            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Sidebar navigation between settings sections                         */
/* ------------------------------------------------------------------ */

// `SettingsNav` lives in its own `'use client'` file because it depends
// on `usePathname`. It is re-exported here so existing imports
// (`import { SettingsNav } from '@/components/settings/settings-shell'`)
// continue to work.
export { SettingsNav } from './settings-nav';
export type { SettingsNavProps } from './settings-nav';

/* ------------------------------------------------------------------ */
/* Two-column layout (nav + content)                                    */
/* ------------------------------------------------------------------ */

export function SettingsGridLayout({
    nav,
    children,
}: {
    nav?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[260px-1fr] gap-4">
            {nav && <div className="lg:sticky lg:top-4 lg:self-start">{nav}</div>}
            <div className="min-w-0 space-y-4">{children}</div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Section card                                                         */
/* ------------------------------------------------------------------ */

export function SettingsSectionCard({
    title,
    description,
    icon,
    actions,
    children,
    footer,
    className,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden',
                className
            )}
        >
            {(title || actions) && (
                <div className="px-5 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        {icon && (
                            <span className="h-10 w-10 rounded-xl bg-[#F3EEF8] text-[#7F4D9F] flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]">
                                {icon}
                            </span>
                        )}
                        <div className="min-w-0">
                            {title && (
                                <h2 className="text-base font-semibold text-gray-900 truncate">{title}</h2>
                            )}
                            {description && (
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                            )}
                        </div>
                    </div>
                    {actions && <div className="shrink-0">{actions}</div>}
                </div>
            )}
            <div className="px-5 py-5">{children}</div>
            {footer && (
                <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/40 flex items-center justify-end gap-2">
                    {footer}
                </div>
            )}
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Field                                                               */
/* ------------------------------------------------------------------ */

export function SettingsField({
    label,
    hint,
    required,
    error,
    htmlFor,
    children,
}: {
    label: React.ReactNode;
    hint?: React.ReactNode;
    required?: boolean;
    error?: React.ReactNode;
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="block text-[12px] font-semibold text-gray-700">
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {error ? (
                <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <CircleDot className="w-3 h-3" />
                    {error}
                </p>
            ) : hint ? (
                <p className="text-[11px] text-gray-400">{hint}</p>
            ) : null}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                               */
/* ------------------------------------------------------------------ */

function initialsFor(name?: string | null) {
    if (!name) return '?';
    const parts = name.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0] ?? '';
    if (parts.length === 1) return first.slice(0, 2).toUpperCase();
    const last = parts[parts.length - 1] ?? '';
    return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

export function SettingsAvatar({
    name,
    className,
}: {
    name?: string | null;
    className?: string;
}) {
    return (
        <Avatar className={cn('h-12 w-12 rounded-xl', className)}>
            <AvatarFallback className="rounded-xl text-white text-sm font-bold bg-gradient-to-br from-[#7F4D9F] to-[#5E3B7A]">
                {initialsFor(name)}
            </AvatarFallback>
        </Avatar>
    );
}

/* ------------------------------------------------------------------ */
/* Inline status pill                                                   */
/* ------------------------------------------------------------------ */

export function SettingsStatPill({
    label,
    value,
    icon,
    hint,
    tone = 'neutral',
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    icon?: React.ReactNode;
    hint?: React.ReactNode;
    tone?: 'positive' | 'negative' | 'warning' | 'neutral' | 'info';
}) {
    const toneMap = {
        positive: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
        negative: { bg: 'bg-rose-50', fg: 'text-rose-600' },
        warning: { bg: 'bg-amber-50', fg: 'text-amber-600' },
        info: { bg: 'bg-sky-50', fg: 'text-sky-600' },
        neutral: { bg: 'bg-[#F3EEF8]', fg: 'text-[#7F4D9F]' },
    } as const;
    const t = toneMap[tone];
    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-4 py-4 flex items-center gap-3">
            {icon && (
                <span className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]', t.bg, t.fg)}>
                    {icon}
                </span>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 truncate">
                    {label}
                </p>
                <div className="text-2xl font-bold font-heading leading-tight mt-0.5 truncate">
                    {value}
                </div>
                {hint && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{hint}</p>}
            </div>
        </div>
    );
}

export function SettingsStatusPill({
    tone = 'neutral',
    children,
}: {
    tone?: 'positive' | 'negative' | 'warning' | 'neutral' | 'info';
    children: React.ReactNode;
}) {
    const styles =
        tone === 'positive'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : tone === 'negative'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : tone === 'warning'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : tone === 'info'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200';
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                styles
            )}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {children}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                 */
/* ------------------------------------------------------------------ */

export function SettingsFooterLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#7F4D9F] hover:text-[#5E3B7A] transition-colors"
        >
            {children}
            <ArrowRight className="w-3 h-3" />
        </Link>
    );
}

export { SettingsIcon, Lock, CheckCircle2 };

/* ------------------------------------------------------------------ */
/* Brand input — same look as Finance / CRM filters but tinted violet */
/* ------------------------------------------------------------------ */

export const settingsInputClass =
    'h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 transition-all outline-none focus:border-[#7F4D9F] focus:ring-2 focus:ring-[#7F4D9F]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50';

export function SettingsInput({
    className,
    invalid,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
    return (
        <input
            className={cn(
                settingsInputClass,
                invalid && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20',
                className
            )}
            {...props}
        />
    );
}

export function SettingsTextarea({
    className,
    ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={cn(
                settingsInputClass,
                'h-auto py-2 min-h-[80px] resize-y',
                className
            )}
            {...props}
        />
    );
}

export function SettingsSelect({
    className,
    children,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={cn(settingsInputClass, 'pr-8', className)} {...props}>
            {children}
        </select>
    );
}

/* ------------------------------------------------------------------ */
/* Save bar                                                            */
/* ------------------------------------------------------------------ */

export function SettingsSaveBar({
    isSaving = false,
    isDirty = false,
    onCancel,
    onSave,
    saveLabel = 'Save changes',
}: {
    isSaving?: boolean;
    isDirty?: boolean;
    onCancel?: () => void;
    onSave: () => void;
    saveLabel?: string;
}) {
    return (
        <div className="flex items-center justify-end gap-2">
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="h-9 px-4 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
            )}
            <button
                type="button"
                onClick={onSave}
                disabled={isSaving || !isDirty}
                className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#7F4D9F] text-white hover:bg-[#5E3B7A] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
                {isSaving && (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {isSaving ? 'Saving…' : saveLabel}
            </button>
        </div>
    );
}