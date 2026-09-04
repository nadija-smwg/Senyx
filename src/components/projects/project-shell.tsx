'use client';

/**
 * Shared Projects visual language.
 *
 * Mirrors the structure of crm-shell.tsx so the Projects section feels
 * like part of the same system as Dashboard / CRM / HR. This file is
 * purely presentation — no business logic is touched.
 */

import * as React from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowRight,
    Briefcase,
    Calendar,
    CircleDot,
    Clock,
    DollarSign,
    FileText,
    Flag,
    LayoutDashboard,
    Link2,
    Target,
    type LucideIcon,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/* ------------------------------------------------------------------ */
/* Brand tokens                                                          */
/* ------------------------------------------------------------------ */

/**
 * The Projects module accent (matches the sidebar group "Projects").
 */
export const PROJECT_BRAND = {
    primary: '#059669', // emerald
    primaryTint: '#ECFDF5',
    deep: '#047857',
    border: '#A7F3D0',
} as const;

/* ------------------------------------------------------------------ */
/* Status / type metadata                                               */
/* ------------------------------------------------------------------ */

export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; variant: 'positive' | 'warning' | 'negative' | 'neutral'; dot: string; bg: string; fg: string; border: string }> = {
    planning: { label: 'Planning', variant: 'warning', dot: 'bg-amber-500', bg: 'bg-amber-50', fg: 'text-amber-700', border: 'border-amber-200' },
    active: { label: 'Active', variant: 'positive', dot: 'bg-emerald-500', bg: 'bg-emerald-50', fg: 'text-emerald-700', border: 'border-emerald-200' },
    on_hold: { label: 'On Hold', variant: 'negative', dot: 'bg-rose-500', bg: 'bg-rose-50', fg: 'text-rose-700', border: 'border-rose-200' },
    completed: { label: 'Completed', variant: 'neutral', dot: 'bg-slate-500', bg: 'bg-slate-50', fg: 'text-slate-700', border: 'border-slate-200' },
    cancelled: { label: 'Cancelled', variant: 'neutral', dot: 'bg-slate-400', bg: 'bg-slate-50', fg: 'text-slate-500', border: 'border-slate-200' },
};

export const PROJECT_TYPE_META: Record<string, { label: string; variant: 'positive' | 'warning' | 'neutral' | 'secondary' | 'negative' }> = {
    solution: { label: 'Solution', variant: 'positive' },
    product: { label: 'Product', variant: 'neutral' },
    internal: { label: 'Internal', variant: 'secondary' },
};

export const PROJECT_BILLING_META: Record<string, { label: string; variant: 'positive' | 'warning' | 'neutral' | 'secondary' }> = {
    fixed: { label: 'Fixed Fee', variant: 'positive' },
    time_materials: { label: 'T&M', variant: 'neutral' },
    retainer: { label: 'Retainer', variant: 'warning' },
};

/* ------------------------------------------------------------------ */
/* Badges                                                               */
/* ------------------------------------------------------------------ */

export function ProjectStatusBadge({
    status,
    className,
}: {
    status?: string | null;
    className?: string;
}) {
    const knownStatus = status && (PROJECT_STATUSES as readonly string[]).includes(status)
        ? (status as ProjectStatus)
        : undefined;
    const meta = (knownStatus && PROJECT_STATUS_META[knownStatus]) || {
        label: status || '—',
        variant: 'secondary',
        dot: 'bg-gray-400',
        bg: 'bg-gray-50',
        fg: 'text-gray-700',
        border: 'border-gray-200',
    };
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                meta.bg,
                meta.fg,
                meta.border,
                className
            )}
        >
            <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
            {meta.label}
        </span>
    );
}

export function ProjectTypeBadge({
    type,
    className,
}: {
    type?: string | null;
    className?: string;
}) {
    const meta = type ? PROJECT_TYPE_META[type] : undefined;
    const variant = meta?.variant ?? 'secondary';
    return (
        <Badge variant={variant as 'positive' | 'warning' | 'neutral' | 'secondary'} className={className}>
            {meta?.label ?? type ?? '—'}
        </Badge>
    );
}

export function ProjectBillingBadge({
    billingType,
    className,
}: {
    billingType?: string | null;
    className?: string;
}) {
    const meta = billingType ? PROJECT_BILLING_META[billingType] : undefined;
    const variant = meta?.variant ?? 'secondary';
    return (
        <Badge variant={variant as 'positive' | 'warning' | 'neutral' | 'secondary'} className={className}>
            {meta?.label ?? billingType ?? '—'}
        </Badge>
    );
}

/* ------------------------------------------------------------------ */
/* Progress bar (time-elapsed based)                                    */
/* ------------------------------------------------------------------ */

/**
 * Compute progress percent from start/end dates. Returns null when no dates
 * are set or when the project hasn't started yet. Caps at 100.
 */
export function computeProgress(startDate?: string | null, endDate?: string | null, now: Date = new Date()): number | null {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
    const ratio = (now.getTime() - start) / (end - start);
    if (ratio <= 0) return 0;
    if (ratio >= 1) return 100;
    return Math.round(ratio * 100);
}

export function ProjectProgressBar({
    percent,
    status,
    className,
}: {
    percent: number | null;
    status?: string | null;
    className?: string;
}) {
    const p = percent ?? 0;
    const knownStatus = status && (PROJECT_STATUSES as readonly string[]).includes(status)
        ? (status as ProjectStatus)
        : undefined;
    const meta = (knownStatus && PROJECT_STATUS_META[knownStatus]) || { dot: 'bg-[#059669]' };
    const completed = status === 'completed';
    const cancelled = status === 'cancelled';
    const overdue = percent !== null && percent >= 100 && !completed && !cancelled;

    return (
        <div className={cn('w-full', className)}>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all',
                        cancelled && 'bg-slate-300',
                        completed && 'bg-emerald-500',
                        !cancelled && !completed && (overdue ? 'bg-rose-500' : meta.dot)
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
                />
            </div>
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

export function ProjectAvatar({
    name,
    className,
}: {
    name?: string | null;
    className?: string;
}) {
    return (
        <Avatar className={cn('h-7 w-7 rounded-md', className)}>
            <AvatarFallback className="rounded-md bg-gradient-to-br from-[#059669] to-[#22BFE8] text-white text-[11px] font-bold">
                {initialsFor(name)}
            </AvatarFallback>
        </Avatar>
    );
}

/* ------------------------------------------------------------------ */
/* Page header (server-component-friendly)                              */
/* ------------------------------------------------------------------ */

interface ProjectPageShellProps {
    pretitle?: string;
    title: string;
    description?: string;
    /** Compact "code PRJ-0007" badge shown next to the title. */
    code?: string;
    status?: string;
    /** Right side actions (edit / clock-in). */
    actions?: React.ReactNode;
    /** KPI / metric cards row. */
    stats?: React.ReactNode;
    /** Toolbar row (search / filters). */
    toolbar?: React.ReactNode;
    children: React.ReactNode;
}

export function ProjectPageShell({
    pretitle,
    title,
    description,
    code,
    status,
    actions,
    stats,
    toolbar,
    children,
}: ProjectPageShellProps) {
    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[180%] rounded-[100%] bg-gradient-to-br from-[#059669]/12 via-[#22BFE8]/8 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-60%] left-[-10%] w-[40%] h-[180%] rounded-[100%] bg-gradient-to-tr from-[#F9A01B]/10 via-[#7F4D9F]/8 to-transparent blur-3xl pointer-events-none" />
                <div className="relative px-5 sm:px-7 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                        {pretitle && (
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#059669] via-[#22BFE8] to-[#1A6DB6] bg-clip-text text-transparent">
                                {pretitle}
                            </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-extrabold font-heading text-gray-900 tracking-tight truncate">
                                {title}
                            </h1>
                            {code && (
                                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                                    {code}
                                </span>
                            )}
                            {status && <ProjectStatusBadge status={status} />}
                        </div>
                        {description && (
                            <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
                </div>
            </div>

            {stats && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{stats}</div>}
            {toolbar && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-3 py-2.5">
                    {toolbar}
                </div>
            )}

            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                            */
/* ------------------------------------------------------------------ */

interface ProjectStatCardProps {
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    icon?: React.ReactNode;
    accent?: 'neutral' | 'positive' | 'warning' | 'negative' | 'info';
}

const projAccentMap = {
    neutral: { bg: 'bg-[#ECFDF5]', fg: 'text-[#059669]' },
    positive: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    warning: { bg: 'bg-amber-50', fg: 'text-amber-600' },
    negative: { bg: 'bg-rose-50', fg: 'text-rose-600' },
    info: { bg: 'bg-sky-50', fg: 'text-sky-600' },
} as const;

export function ProjectStatCard({ label, value, hint, icon, accent = 'neutral' }: ProjectStatCardProps) {
    const a = projAccentMap[accent];
    return (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-4 py-3.5 flex items-center gap-3">
            {icon && (
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]', a.bg, a.fg)}>
                    {icon}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 truncate">{label}</p>
                <div className="text-xl font-bold font-heading text-gray-900 leading-tight mt-0.5 tabular-nums truncate">{value}</div>
                {hint && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{hint}</p>}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Tabs (used by project detail layout)                                 */
/* ------------------------------------------------------------------ */

export type ProjectTabIconName =
    | 'overview'
    | 'links'
    | 'team'
    | 'milestones'
    | 'payments'
    | 'time'
    | 'risks'
    | 'documents';

export interface ProjectTab {
    name: string;
    href: string;
    iconName: ProjectTabIconName;
}

const TAB_ICON_MAP: Record<ProjectTabIconName, LucideIcon> = {
    overview: LayoutDashboard,
    links: Link2,
    team: Users,
    milestones: Flag,
    payments: DollarSign,
    time: Clock,
    risks: AlertTriangle,
    documents: FileText,
};

export function ProjectTabs({
    tabs,
    currentPath,
}: {
    tabs: ProjectTab[];
    currentPath: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-2 py-1.5">
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                {tabs.map(t => {
                    const active = currentPath === t.href || currentPath.startsWith(`${t.href}/`);
                    const Icon = TAB_ICON_MAP[t.iconName] ?? LayoutDashboard;
                    return (
                        <Link
                            key={t.name}
                            href={t.href}
                            className={cn(
                                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap',
                                active
                                    ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {t.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Detail / overview helpers                                            */
/* ------------------------------------------------------------------ */

export function ProjectDetailRow({
    label,
    icon,
    children,
}: {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
            <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center [&_svg]:w-3.5 [&_svg]:h-3.5 shrink-0">
                {icon ?? <CircleDot className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
                <div className="text-sm text-gray-900 mt-0.5">{children}</div>
            </div>
        </div>
    );
}

export function ProjectSection({
    title,
    description,
    actions,
    children,
    className,
}: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
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
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        {title && <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>}
                        {description && <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>}
                    </div>
                    {actions && <div className="shrink-0">{actions}</div>}
                </div>
            )}
            <div className="p-5">{children}</div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Default icons                                                        */
/* ------------------------------------------------------------------ */

export const PROJECT_ICONS = {
    briefcase: Briefcase,
    calendar: Calendar,
    target: Target,
    flag: Flag,
} as const;

export function ProjectFooterLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669] hover:text-[#047857] transition-colors"
        >
            {children}
            <ArrowRight className="w-3 h-3" />
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/* Date helpers                                                          */
/* ------------------------------------------------------------------ */

export function formatProjectDate(d?: string | null) {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatProjectDateRange(start?: string | null, end?: string | null) {
    const a = formatProjectDate(start);
    const b = formatProjectDate(end);
    if (a === '—' && b === '—') return '—';
    if (a === '—') return b;
    if (b === '—') return a;
    return `${a} → ${b}`;
}