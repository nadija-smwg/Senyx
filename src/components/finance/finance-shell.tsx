/**
 * Shared Finance visual language.
 *
 * Mirrors the structure of crm-shell.tsx and project-shell.tsx so the
 * Finance pages feel consistent with the rest of Senyx. Pure
 * presentation only — no business logic is touched.
 */

import * as React from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowRight,
    ArrowUpCircle,
    Building2,
    Calendar,
    CircleDot,
    type LucideIcon,
    Receipt,
    Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/ui/currency-display';

/* ------------------------------------------------------------------ */
/* Brand tokens                                                          */
/* ------------------------------------------------------------------ */

export const FINANCE_BRAND = {
    primary: '#C1172C',
    primaryTint: '#FCECEC',
    deep: '#9B1022',
    border: '#F4BFC4',
    income: '#059669',
    outcome: '#C1172C',
} as const;

/* ------------------------------------------------------------------ */
/* Status / category metadata                                            */
/* ------------------------------------------------------------------ */

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; variant: 'positive' | 'negative' | 'warning' | 'neutral' | 'default'; bg: string; fg: string; border: string }> = {
    draft: { label: 'Draft', variant: 'neutral', bg: 'bg-slate-50', fg: 'text-slate-700', border: 'border-slate-200' },
    sent: { label: 'Sent', variant: 'warning', bg: 'bg-amber-50', fg: 'text-amber-700', border: 'border-amber-200' },
    paid: { label: 'Paid', variant: 'positive', bg: 'bg-emerald-50', fg: 'text-emerald-700', border: 'border-emerald-200' },
    overdue: { label: 'Overdue', variant: 'negative', bg: 'bg-rose-50', fg: 'text-rose-700', border: 'border-rose-200' },
    void: { label: 'Void', variant: 'default', bg: 'bg-slate-100', fg: 'text-slate-600', border: 'border-slate-300' },
};

export const EXPENSE_STATUSES = ['pending', 'approved', 'reimbursed', 'rejected'] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const EXPENSE_STATUS_META: Record<ExpenseStatus, { label: string; variant: 'positive' | 'negative' | 'warning' | 'neutral'; bg: string; fg: string; border: string }> = {
    pending: { label: 'Pending', variant: 'warning', bg: 'bg-amber-50', fg: 'text-amber-700', border: 'border-amber-200' },
    approved: { label: 'Approved', variant: 'positive', bg: 'bg-sky-50', fg: 'text-sky-700', border: 'border-sky-200' },
    reimbursed: { label: 'Reimbursed', variant: 'positive', bg: 'bg-emerald-50', fg: 'text-emerald-700', border: 'border-emerald-200' },
    rejected: { label: 'Rejected', variant: 'negative', bg: 'bg-rose-50', fg: 'text-rose-700', border: 'border-rose-200' },
};

export const PAYMENT_METHOD_META: Record<string, { label: string; variant: 'positive' | 'neutral' | 'warning' }> = {
    bank_transfer: { label: 'Bank Transfer', variant: 'positive' },
    card: { label: 'Card', variant: 'neutral' },
    cash: { label: 'Cash', variant: 'warning' },
    cheque: { label: 'Cheque', variant: 'neutral' },
    online: { label: 'Online', variant: 'positive' },
};

export const EXPENSE_CATEGORY_META: Record<string, { label: string; variant: 'positive' | 'neutral' | 'warning' | 'secondary' | 'negative' }> = {
    'Travel': { label: 'Travel', variant: 'positive' },
    'Meals': { label: 'Meals', variant: 'warning' },
    'Office Supplies': { label: 'Office Supplies', variant: 'neutral' },
    'Software': { label: 'Software', variant: 'positive' },
    'Other': { label: 'Other', variant: 'secondary' },
};

/* ------------------------------------------------------------------ */
/* Badges                                                               */
/* ------------------------------------------------------------------ */

export function FinanceStatusBadge({
    status,
    className,
}: {
    status?: string | null;
    className?: string;
}) {
    const meta = status ? INVOICE_STATUS_META[status as InvoiceStatus] : undefined;
    if (!meta) {
        return (
            <span className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-gray-50 text-gray-700 border-gray-200',
                className
            )}>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                {(status || '—').toUpperCase()}
            </span>
        );
    }
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
            meta.bg,
            meta.fg,
            meta.border,
            className
        )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {meta.label}
        </span>
    );
}

export function ExpenseStatusBadge({
    status,
    className,
}: {
    status?: string | null;
    className?: string;
}) {
    const meta = status ? EXPENSE_STATUS_META[status as ExpenseStatus] : undefined;
    const label = meta?.label ?? (status || 'Pending');
    return (
        <Badge variant={(meta?.variant ?? 'warning') as 'positive' | 'negative' | 'warning' | 'neutral'} className={className}>
            {label}
        </Badge>
    );
}

export function ExpenseCategoryBadge({
    category,
    className,
}: {
    category?: string | null;
    className?: string;
}) {
    const meta = category ? EXPENSE_CATEGORY_META[category] : undefined;
    const variant = meta?.variant ?? 'secondary';
    const label = meta?.label ?? (category || '—');
    return (
        <Badge
            variant={variant as 'positive' | 'neutral' | 'warning' | 'secondary'}
            className={className}
        >
            {label}
        </Badge>
    );
}

export function PaymentMethodBadge({
    method,
    className,
}: {
    method?: string | null;
    className?: string;
}) {
    const meta = method ? PAYMENT_METHOD_META[method] : undefined;
    const variant = meta?.variant ?? 'neutral';
    const label = meta?.label ?? (method || '—');
    return (
        <Badge
            variant={variant as 'positive' | 'neutral' | 'warning'}
            className={className}
        >
            {label}
        </Badge>
    );
}

/* ------------------------------------------------------------------ */
/* Amount helpers                                                       */
/* ------------------------------------------------------------------ */

export type FinanceTone = 'positive' | 'negative' | 'neutral' | 'warning' | 'info';

/**
 * Tone-aware currency amount — uses positive (emerald) for income and
 * negative (rose) for expense. Defaults to neutral gray.
 */
export function FinanceAmount({
    amount,
    currency,
    tone = 'neutral',
    className,
    bold = true,
}: {
    amount: number | string | null | undefined;
    currency?: string;
    tone?: FinanceTone;
    className?: string;
    bold?: boolean;
}) {
    const num = typeof amount === 'string' ? parseFloat(amount || '0') : Number(amount ?? 0);
    const colorClass =
        tone === 'positive' ? 'text-emerald-700'
            : tone === 'negative' ? 'text-rose-700'
                : tone === 'warning' ? 'text-amber-700'
                    : tone === 'info' ? 'text-sky-700'
                        : 'text-gray-900';
    return (
        <span className={cn('inline-flex items-center tabular-nums', bold && 'font-semibold', colorClass, className)}>
            {tone === 'positive' && <ArrowUpCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
            {tone === 'negative' && <ArrowDownCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />}
            <CurrencyDisplay amount={num} className="!text-[inherit] !font-[inherit]" />
            {currency && <span className="ml-1 text-[10px] uppercase font-semibold text-gray-400">{currency}</span>}
        </span>
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

export function FinanceAvatar({
    name,
    className,
    tone = 'neutral',
}: {
    name?: string | null;
    className?: string;
    tone?: 'neutral' | 'positive' | 'negative';
}) {
    const gradient =
        tone === 'positive'
            ? 'from-emerald-500 to-emerald-700'
            : tone === 'negative'
                ? 'from-rose-500 to-rose-700'
                : 'from-[#C1172C] to-[#9B1022]';
    return (
        <Avatar className={cn('h-7 w-7 rounded-md', className)}>
            <AvatarFallback className={cn('rounded-md text-white text-[11px] font-bold bg-gradient-to-br', gradient)}>
                {initialsFor(name)}
            </AvatarFallback>
        </Avatar>
    );
}

/* ------------------------------------------------------------------ */
/* Page shell (server-renderable)                                       */
/* ------------------------------------------------------------------ */

interface FinancePageShellProps {
    pretitle?: string;
    title: string;
    description?: string;
    actions?: React.ReactNode;
    stats?: React.ReactNode;
    /** Optional toolbar below the stats row (filters / actions). */
    toolbar?: React.ReactNode;
    children: React.ReactNode;
}

export function FinancePageShell({
    pretitle,
    title,
    description,
    actions,
    stats,
    toolbar,
    children,
}: FinancePageShellProps) {
    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[180%] rounded-[100%] bg-gradient-to-br from-[#C1172C]/12 via-[#9B1022]/8 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-60%] left-[-10%] w-[40%] h-[180%] rounded-[100%] bg-gradient-to-tr from-[#F9A01B]/10 via-[#7F4D9F]/8 to-transparent blur-3xl pointer-events-none" />
                <div className="relative px-5 sm:px-7 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                        {pretitle && (
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#C1172C] via-[#9B1022] to-[#F15A22] bg-clip-text text-transparent">
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

            {stats && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{stats}</div>}

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

interface FinanceStatCardProps {
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    icon?: React.ReactNode;
    tone?: FinanceTone;
    /** When true the card has an accent gradient stripe. */
    hero?: boolean;
}

const toneMap = {
    positive: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    negative: { bg: 'bg-rose-50', fg: 'text-rose-600' },
    warning: { bg: 'bg-amber-50', fg: 'text-amber-600' },
    neutral: { bg: 'bg-[#FCECEC]', fg: 'text-[#C1172C]' },
    info: { bg: 'bg-sky-50', fg: 'text-sky-600' },
} as const;

export function FinanceStatCard({ label, value, hint, icon, tone = 'neutral', hero = false }: FinanceStatCardProps) {
    const t = toneMap[tone];
    return (
        <div
            className={cn(
                'rounded-2xl bg-white border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-4 py-4 relative overflow-hidden',
                hero && 'lg:col-span-2 xl:col-span-2'
            )}
        >
            {hero && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#C1172C]/8 via-[#9B1022]/4 to-transparent" />
            )}
            <div className="relative flex items-center gap-3">
                {icon && (
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]', t.bg, t.fg)}>
                        {icon}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 truncate">{label}</p>
                    <div className={cn('text-2xl font-bold font-heading tabular-nums leading-tight mt-0.5 truncate', tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-rose-700' : tone === 'warning' ? 'text-amber-700' : tone === 'info' ? 'text-sky-700' : 'text-gray-900')}>
                        {value}
                    </div>
                    {hint && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{hint}</p>}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Table                                                                */
/* ------------------------------------------------------------------ */

export interface FinanceTableColumn<T> {
    id: string;
    header: React.ReactNode;
    cell: (row: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'right' | 'center';
    hideOn?: 'sm' | 'md' | 'lg';
}

interface FinanceTableProps<T> {
    columns: FinanceTableColumn<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    emptyState?: React.ReactNode;
}

export function FinanceTable<T>({ columns, rows, rowKey, emptyState }: FinanceTableProps<T>) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                            {columns.map(c => (
                                <th
                                    key={c.id}
                                    scope="col"
                                    className={cn(
                                        'px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500',
                                        c.align === 'right' && 'text-right',
                                        c.align === 'center' && 'text-center',
                                        c.hideOn === 'sm' && 'hidden sm:table-cell',
                                        c.hideOn === 'md' && 'hidden md:table-cell',
                                        c.hideOn === 'lg' && 'hidden lg:table-cell',
                                        c.width
                                    )}
                                >
                                    {c.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-0">
                                    {emptyState ?? <FinanceEmptyState />}
                                </td>
                            </tr>
                        ) : (
                            rows.map(r => (
                                <tr
                                    key={rowKey(r)}
                                    className="hover:bg-[#FCECEC]/30 transition-colors"
                                >
                                    {columns.map(c => (
                                        <td
                                            key={c.id}
                                            className={cn(
                                                'px-4 py-3 align-middle',
                                                c.align === 'right' && 'text-right',
                                                c.align === 'center' && 'text-center',
                                                c.hideOn === 'sm' && 'hidden sm:table-cell',
                                                c.hideOn === 'md' && 'hidden md:table-cell',
                                                c.hideOn === 'lg' && 'hidden lg:table-cell'
                                            )}
                                        >
                                            {c.cell(r)}
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
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

export function FinanceEmptyState({
    icon,
    title,
    description,
}: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center text-center px-6 py-12 gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FCECEC] text-[#C1172C] flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6">
                {icon ?? <Receipt className="w-6 h-6" />}
            </div>
            <p className="font-semibold text-gray-800">{title ?? 'No records found'}</p>
            {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export function FinanceSection({
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
            <div className={cn(title ? 'p-5' : 'p-0')}>{children}</div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Filter bar (server-friendly GET form)                               */
/* ------------------------------------------------------------------ */

interface FinanceFilterBarProps {
    children: React.ReactNode;
}

export function FinanceFilterBar({ children }: FinanceFilterBarProps) {
    return (
        <form method="GET" className="flex flex-wrap items-center gap-2">
            {children}
        </form>
    );
}

/* ------------------------------------------------------------------ */
/* Aging bar                                                            */
/* ------------------------------------------------------------------ */

export interface AgingBucket {
    label: string;
    amount: number;
    tone?: 'positive' | 'warning' | 'negative' | 'neutral';
}

export function AgingBar({ buckets }: { buckets: AgingBucket[] }) {
    const total = buckets.reduce((s, b) => s + b.amount, 0);
    if (total === 0) {
        return <p className="text-sm text-gray-500 italic">No outstanding receivables.</p>;
    }
    return (
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
            {buckets.map((b, i) => {
                const pct = (b.amount / total) * 100;
                if (pct <= 0) return null;
                const color =
                    b.tone === 'negative' ? 'bg-rose-500'
                        : b.tone === 'warning' ? 'bg-amber-500'
                            : b.tone === 'positive' ? 'bg-emerald-500'
                                : 'bg-sky-500';
                return (
                    <div
                        key={i}
                        className={cn(color, 'h-full')}
                        style={{ width: `${pct}%` }}
                        title={`${b.label}: ${b.amount.toLocaleString()}`}
                    />
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Project receivable card                                              */
/* ------------------------------------------------------------------ */

export function ProjectReceivableCard({
    name,
    amount,
    milestones,
}: {
    name: string;
    amount: number;
    milestones: Array<{ name: string; amount: number }>;
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
                </div>
                <FinanceAmount amount={amount} tone="negative" />
            </div>
            {milestones.length > 0 && (
                <ul className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    {milestones.map((m, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-gray-500 truncate">{m.name}</span>
                            <FinanceAmount amount={m.amount} tone="negative" className="!text-[11px]" />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                 */
/* ------------------------------------------------------------------ */

export const FINANCE_ICONS = {
    calendar: Calendar,
    warning: AlertTriangle,
    wallet: Wallet,
    building: Building2,
} as const;

export function FinanceFooterLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C1172C] hover:text-[#9B1022] transition-colors"
        >
            {children}
            <ArrowRight className="w-3 h-3" />
        </Link>
    );
}

export function FinanceDetailRow({
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
            <div className="w-7 h-7 rounded-lg bg-[#FCECEC] text-[#C1172C] flex items-center justify-center [&_svg]:w-3.5 [&_svg]:h-3.5 shrink-0">
                {icon ?? <CircleDot className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
                <div className="text-sm text-gray-900 mt-0.5">{children}</div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Date helpers                                                          */
/* ------------------------------------------------------------------ */

export function formatFinanceDate(d?: string | null) {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysOverdue(dueDate?: string | null): number | null {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return null;
    const diff = Math.ceil((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
}