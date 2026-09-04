/**
 * Shared loading / empty / error UI primitives.
 *
 * Standardizes the look-and-feel of:
 *   - page-level loading spinners (Loader2 + label)
 *   - empty-data states (icon + title + description)
 *   - error states (icon + title + message + retry)
 *
 * Existing visual styles preserved across the app:
 *   - rounded-2xl cards, 1px gray border, [0_1px_3px_rgba(0,0,0,0.04)] shadow
 *   - 12px font-bold uppercase tracking-[0.14em] section labels
 *   - tone-coded icons: positive=emerald, negative=rose, warning=amber, info=sky
 *
 * This file is purely presentational.
 */

import * as React from 'react';
import {
    AlertTriangle,
    Inbox,
    Loader2,
    RefreshCw,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Loading                                                              */
/* ------------------------------------------------------------------ */

export function LoadingState({
    label = 'Loading…',
    className,
    fullHeight = true,
}: {
    label?: React.ReactNode;
    className?: string;
    fullHeight?: boolean;
}) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'flex flex-col items-center justify-center gap-3 text-sm text-gray-500',
                fullHeight ? 'min-h-[240px] py-12' : 'py-6',
                className
            )}
        >
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span>{label}</span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Empty                                                                */
/* ------------------------------------------------------------------ */

export function EmptyState({
    icon,
    title = 'No records found',
    description,
    action,
    className,
}: {
    icon?: LucideIcon;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    const Icon = icon ?? Inbox;
    return (
        <div
            role="status"
            className={cn(
                'flex flex-col items-center justify-center text-center px-6 py-12 gap-2 rounded-2xl bg-white border border-gray-100',
                className
            )}
        >
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6 border border-gray-100">
                <Icon />
            </div>
            <p className="font-semibold text-gray-800">{title}</p>
            {description && (
                <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{description}</p>
            )}
            {action && <div className="pt-1">{action}</div>}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Error                                                                */
/* ------------------------------------------------------------------ */

export function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
    className,
}: {
    title?: React.ReactNode;
    message?: React.ReactNode;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <div
            role="alert"
            className={cn(
                'flex flex-col items-center justify-center text-center px-6 py-12 gap-2 rounded-2xl bg-white border border-rose-100',
                className
            )}
        >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6 border border-rose-100">
                <AlertTriangle />
            </div>
            <p className="font-semibold text-gray-900">{title}</p>
            {message && (
                <p className="text-sm text-gray-500 max-w-md leading-relaxed">{message}</p>
            )}
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 mt-2 h-9 px-3.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try again
                </button>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Section title                                                        */
/* ------------------------------------------------------------------ */

export function SectionTitle({
    label,
    action,
    className,
}: {
    label: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 mb-4',
                className
            )}
        >
            <h2 className="text-gray-500 font-bold uppercase tracking-[0.14em] text-[11px] truncate">
                {label}
            </h2>
            {action}
        </div>
    );
}