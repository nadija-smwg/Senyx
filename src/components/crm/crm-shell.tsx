'use client';

/**
 * Shared CRM visual language.
 *
 * All Accounts / Contacts / Deals pages build on these primitives so the
 * three pages share the same chrome: page header, stat cards, toolbar,
 * table, badges, empty / loading / error states.
 *
 * Nothing in this file introduces data, routes, or business logic. It is
 * a pure presentation layer over the existing APIs.
 */

import * as React from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    ArrowRight,
    Building2,
    CheckCircle2,
    Inbox,
    Loader2,
    RefreshCw,
    Search,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ------------------------------------------------------------------ */
/*  Brand tokens                                                        */
/* ------------------------------------------------------------------ */

/**
 * The CRM module accent (matches the sidebar group "CRM & Sales").
 * Used for the page-header gradient, focus rings, status pills, etc.
 */
export const CRM_BRAND = {
    primary: '#F15A22', // orange
    primaryTint: '#FEF0EB',
    deep: '#C9471A',
    info: '#7F4D9F', // accent for kanban stages
    border: '#FBD9C9',
} as const;

/* ------------------------------------------------------------------ */
/*  Page shell                                                          */
/* ------------------------------------------------------------------ */

interface CrmPageShellProps {
    /** Page title shown in the header (e.g. "Accounts"). */
    title: string;
    /** Optional short description shown under the title. */
    description?: string;
    /** Pretitle (small uppercase text above the title). */
    pretitle?: string;
    /** Right-side action area (primary buttons, view toggle, etc.). */
    actions?: React.ReactNode;
    /** KPI / metric cards row. */
    stats?: React.ReactNode;
    /** Toolbar with search + filters (rendered between stats and content). */
    toolbar?: React.ReactNode;
    children: React.ReactNode;
}

export function CrmPageShell({
    title,
    description,
    pretitle,
    actions,
    stats,
    toolbar,
    children,
}: CrmPageShellProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[180%] rounded-[100%] bg-gradient-to-br from-[#F15A22]/12 via-[#7F4D9F]/8 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-60%] left-[-10%] w-[40%] h-[180%] rounded-[100%] bg-gradient-to-tr from-[#F9A01B]/10 via-[#EC4C49]/8 to-transparent blur-3xl pointer-events-none" />
                <div className="relative px-5 sm:px-7 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                        {pretitle && (
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#F15A22] via-[#7F4D9F] to-[#1A6DB6] bg-clip-text text-transparent">
                                {pretitle}
                            </p>
                        )}
                        <h1 className="mt-1 text-2xl font-extrabold font-heading text-gray-900 tracking-tight truncate">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
                    )}
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
/*  Stats / KPI cards                                                   */
/* ------------------------------------------------------------------ */

interface CrmStatCardProps {
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    icon?: React.ReactNode;
    accent?: 'neutral' | 'positive' | 'warning' | 'negative' | 'info';
}

const accentMap = {
    neutral: { bg: 'bg-[#FEF0EB]', fg: 'text-[#F15A22]' },
    positive: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    warning: { bg: 'bg-amber-50', fg: 'text-amber-600' },
    negative: { bg: 'bg-rose-50', fg: 'text-rose-600' },
    info: { bg: 'bg-[#F2E8FA]', fg: 'text-[#7F4D9F]' },
} as const;

export function CrmStatCard({
    label,
    value,
    hint,
    icon,
    accent = 'neutral',
}: CrmStatCardProps) {
    const a = accentMap[accent];
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
/*  Toolbar (search + filters)                                          */
/* ------------------------------------------------------------------ */

interface CrmSearchBarProps {
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
    className?: string;
}

export function CrmSearchBar({
    value,
    onChange,
    placeholder = 'Search…',
    className,
}: CrmSearchBarProps) {
    return (
        <div className={cn('relative w-full sm:w-72', className)}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-8 pr-8 h-9"
            />
            {value && (
                <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => onChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

interface CrmToolbarProps {
    children: React.ReactNode;
}

export function CrmToolbar({ children }: CrmToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  View toggle                                                         */
/* ------------------------------------------------------------------ */

export function CrmViewToggle<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (next: T) => void;
    options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
    return (
        <div className="inline-flex items-center bg-gray-100 p-1 rounded-lg">
            {options.map(opt => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[13px] font-semibold transition-colors',
                            active
                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        {opt.icon}
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Status / stage badges                                               */
/* ------------------------------------------------------------------ */

/**
 * Map for account status → badge variant + label.
 */
const ACCOUNT_STATUS: Record<string, { variant: 'positive' | 'warning' | 'neutral'; label: string }> = {
    active: { variant: 'positive', label: 'Active' },
    prospect: { variant: 'warning', label: 'Prospect' },
    inactive: { variant: 'neutral', label: 'Inactive' },
};

/**
 * Map for deal status (open / won / lost).
 */
const DEAL_STATUS: Record<string, { variant: 'positive' | 'negative' | 'neutral'; label: string }> = {
    open: { variant: 'neutral', label: 'Open' },
    won: { variant: 'positive', label: 'Won' },
    lost: { variant: 'negative', label: 'Lost' },
};

/**
 * Map for deal stage. Each stage has an accent colour used in the kanban
 * board and the stage badge.
 */
export const DEAL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const DEAL_STAGE_META: Record<DealStage, { label: string; bg: string; fg: string; border: string; dot: string }> = {
    lead: { label: 'Lead', bg: 'bg-slate-50', fg: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
    qualified: { label: 'Qualified', bg: 'bg-sky-50', fg: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
    proposal: { label: 'Proposal', bg: 'bg-indigo-50', fg: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    negotiation: { label: 'Negotiation', bg: 'bg-amber-50', fg: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    won: { label: 'Won', bg: 'bg-emerald-50', fg: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    lost: { label: 'Lost', bg: 'bg-rose-50', fg: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export function CrmStatusBadge({
    status,
    size = 'default',
    className,
}: {
    status?: string | null;
    size?: 'default' | 'sm';
    className?: string;
}) {
    const meta = status ? ACCOUNT_STATUS[status] : undefined;
    const variant = meta?.variant ?? 'secondary';
    return (
        <Badge variant={variant} className={cn(size === 'sm' && 'text-[9px] px-1.5 py-0', className)}>
            {meta?.label ?? status ?? '—'}
        </Badge>
    );
}

export function CrmDealStatusBadge({
    status,
    className,
}: {
    status?: string | null;
    className?: string;
}) {
    const meta = status ? DEAL_STATUS[status] : undefined;
    const variant = meta?.variant ?? 'neutral';
    return (
        <Badge variant={variant} className={className}>
            {meta?.label ?? status ?? '—'}
        </Badge>
    );
}

export function CrmStageBadge({
    stage,
    className,
}: {
    stage?: string | null;
    className?: string;
}) {
    const known = stage && (DEAL_STAGES as readonly string[]).includes(stage)
        ? DEAL_STAGE_META[stage as DealStage]
        : undefined;
    const meta = known ?? {
        label: stage || '—',
        bg: 'bg-gray-50',
        fg: 'text-gray-700',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
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

export function CrmHealthBadge({
    risk,
    className,
}: {
    risk?: boolean;
    className?: string;
}) {
    if (risk) {
        return (
            <Badge variant="negative" className={className}>
                At Risk
            </Badge>
        );
    }
    return (
        <Badge variant="positive" className={className}>
            Healthy
        </Badge>
    );
}

/* ------------------------------------------------------------------ */
/*  Person / account chip                                               */
/* ------------------------------------------------------------------ */

export function initialsFor(name?: string | null) {
    if (!name) return '?';
    const parts = name.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0] ?? '';
    if (parts.length === 1) return first.slice(0, 2).toUpperCase();
    const last = parts[parts.length - 1] ?? '';
    return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

export function CrmAvatar({
    name,
    className,
}: {
    name?: string | null;
    className?: string;
}) {
    return (
        <Avatar className={cn('h-8 w-8 rounded-lg', className)}>
            <AvatarFallback className="rounded-lg bg-gradient-to-br from-[#F15A22] to-[#7F4D9F] text-white text-[11px] font-bold">
                {initialsFor(name)}
            </AvatarFallback>
        </Avatar>
    );
}

/**
 * Two-line display: name on top, supporting text underneath.
 * Used for accounts (industry) and contacts (title).
 */
export function CrmNameCell({
    name,
    supporting,
    avatar,
    onClick,
}: {
    name: React.ReactNode;
    supporting?: React.ReactNode;
    avatar?: React.ReactNode;
    onClick?: () => void;
}) {
    const Wrapper = onClick ? 'button' : 'div';
    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={cn(
                'flex items-center gap-2.5 min-w-0 text-left',
                onClick && 'cursor-pointer group'
            )}
        >
            {avatar ?? <CrmAvatar name={typeof name === 'string' ? name : undefined} />}
            <div className="min-w-0">
                <div className={cn('text-sm font-semibold text-gray-900 truncate', onClick && 'group-hover:text-[#F15A22]')}>
                    {name}
                </div>
                {supporting && (
                    <div className="text-[11px] text-gray-400 truncate">{supporting}</div>
                )}
            </div>
        </Wrapper>
    );
}

/* ------------------------------------------------------------------ */
/*  Table                                                               */
/* ------------------------------------------------------------------ */

export interface CrmTableColumn<T> {
    id: string;
    header: React.ReactNode;
    cell: (row: T) => React.ReactNode;
    /** Tailwind width class for the <th> / <td> (e.g. "w-[120px]"). */
    width?: string;
    align?: 'left' | 'right' | 'center';
    hideOn?: 'sm' | 'md';
}

interface CrmTableProps<T> {
    columns: CrmTableColumn<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    emptyState?: React.ReactNode;
    loading?: boolean;
    /** Number of skeleton rows to show when loading. */
    skeletonRows?: number;
}

export function CrmTable<T>({
    columns,
    rows,
    rowKey,
    emptyState,
    loading,
    skeletonRows = 6,
}: CrmTableProps<T>) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                            {columns.map(col => (
                                <th
                                    key={col.id}
                                    scope="col"
                                    className={cn(
                                        'px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500',
                                        col.align === 'right' && 'text-right',
                                        col.align === 'center' && 'text-center',
                                        col.hideOn === 'sm' && 'hidden sm:table-cell',
                                        col.hideOn === 'md' && 'hidden md:table-cell',
                                        col.width
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            Array.from({ length: skeletonRows }).map((_, i) => (
                                <tr key={`sk-${i}`} className="animate-pulse">
                                    {columns.map((col, j) => (
                                        <td
                                            key={col.id}
                                            className={cn(
                                                'px-4 py-3',
                                                col.hideOn === 'sm' && 'hidden sm:table-cell',
                                                col.hideOn === 'md' && 'hidden md:table-cell'
                                            )}
                                        >
                                            <div className="h-3 rounded bg-gray-100" style={{ width: `${60 + ((i + j) % 4) * 10}%` }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-0">
                                    {emptyState ?? <CrmEmptyState title="No results" />}
                                </td>
                            </tr>
                        ) : (
                            rows.map(row => (
                                <tr
                                    key={rowKey(row)}
                                    className="hover:bg-[#FEF0EB]/30 transition-colors group"
                                >
                                    {columns.map(col => (
                                        <td
                                            key={col.id}
                                            className={cn(
                                                'px-4 py-3 align-middle',
                                                col.align === 'right' && 'text-right',
                                                col.align === 'center' && 'text-center',
                                                col.hideOn === 'sm' && 'hidden sm:table-cell',
                                                col.hideOn === 'md' && 'hidden md:table-cell'
                                            )}
                                        >
                                            {col.cell(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                          */
/* ------------------------------------------------------------------ */

interface CrmPaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (next: number) => void;
    className?: string;
}

export function CrmPagination({ page, totalPages, onPageChange, className }: CrmPaginationProps) {
    if (totalPages <= 1) return null;
    return (
        <div className={cn('flex items-center justify-between text-xs text-gray-500 px-1', className)}>
            <span>
                Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
                <span className="font-semibold text-gray-700">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1.5">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Empty / loading / error states                                      */
/* ------------------------------------------------------------------ */

export function CrmEmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: React.ReactNode;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF0EB] text-[#F15A22] flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6">
                {icon ?? <Inbox className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-800">{title}</p>
                {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
            </div>
            {action}
        </div>
    );
}

export function CrmLoadingState({ label = 'Loading…' }: { label?: string }) {
    return (
        <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {label}
        </div>
    );
}

export function CrmErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
}: {
    title?: string;
    message?: React.ReactNode;
    onRetry?: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6">
                <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-800">{title}</p>
                {message && <p className="text-sm text-gray-500 max-w-sm">{message}</p>}
            </div>
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="w-3.5 h-3.5" /> Try again
                </Button>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                       */
/* ------------------------------------------------------------------ */

export function relativeTime(iso?: string | null) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    if (d < 365) return `${Math.floor(d / 30)}mo ago`;
    return `${Math.floor(d / 365)}y ago`;
}

/**
 * A small footer link used at the bottom of cards / empty states.
 */
export function CrmFooterLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#F15A22] hover:text-[#C9471A] transition-colors"
        >
            {children}
            <ArrowRight className="w-3 h-3" />
        </Link>
    );
}

/**
 * Generic "section" wrapper used inside the page shell — a labelled
 * card with consistent chrome.
 */
export function CrmSection({
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
                        {title && (
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
                        )}
                        {description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
                        )}
                    </div>
                    {actions && <div className="shrink-0">{actions}</div>}
                </div>
            )}
            {children}
        </section>
    );
}

/**
 * Convenience icon mapping used by pages when they need a default stat icon.
 */
export const CRM_ICONS = {
    building: Building2,
    check: CheckCircle2,
} as const;