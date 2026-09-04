'use client';

/**
 * Shared visual shell for the public authentication pages.
 *
 * Pure presentation — wraps the auth forms in a Senyx-branded layout
 * that matches the rest of the ERP (Dashboard, Finance, Settings).
 * No authentication logic is changed by this file.
 */

import * as React from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Lock,
    Mail,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Brand tokens                                                          */
/* ------------------------------------------------------------------ */

export const AUTH_BRAND = {
    primary: '#C1172C',     // Finance / brand red
    primaryTint: '#FCECEC',
    deep: '#9B1022',
    accent: '#22BFE8',
    accent2: '#7F4D9F',
    accent3: '#F9A01B',
} as const;

/* ------------------------------------------------------------------ */
/* Background (decorative)                                                */
/* ------------------------------------------------------------------ */

export function AuthBackground() {
    return (
        <>
            {/* Gradient + blurred blobs that match the PageHeader hero */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
            >
                <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[#C1172C]/15 blur-[120px]" />
                <div className="absolute -top-20 right-[-10%] h-[480px] w-[480px] rounded-full bg-[#7F4D9F]/15 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[#22BFE8]/15 blur-[140px]" />
                <div className="absolute bottom-[-10%] left-[-15%] h-[480px] w-[480px] rounded-full bg-[#F9A01B]/15 blur-[140px]" />
            </div>
            {/* Subtle dotted grid texture */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.18) 1px, transparent 0)',
                    backgroundSize: '22px 22px',
                }}
            />
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Brand mark                                                            */
/* ------------------------------------------------------------------ */

export function AuthBrand({
    showTagline = true,
    size = 'default',
}: {
    showTagline?: boolean;
    size?: 'compact' | 'default';
}) {
    const isCompact = size === 'compact';
    return (
        <Link href="/login" className="inline-flex items-center gap-3 group" aria-label="Senyx ERP">
            <span
                className={cn(
                    'rounded-2xl bg-gradient-to-br from-[#C1172C] via-[#9B1022] to-[#7F4D9F] flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(193,23,44,0.45)] group-hover:scale-105 transition-transform',
                    isCompact ? 'h-10 w-10' : 'h-12 w-12'
                )}
            >
                <svg viewBox="0 0 24 24" className={cn(isCompact ? 'h-5 w-5' : 'h-6 w-6')} fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 17l4-9 4 9" />
                    <path d="M9 17l4-9 4 9" />
                    <path d="M15 17l4-9" />
                </svg>
            </span>
            <div className="flex flex-col">
                <span
                    className={cn(
                        'font-heading font-extrabold tracking-tight text-gray-900 leading-none',
                        isCompact ? 'text-lg' : 'text-2xl'
                    )}
                >
                    SENYX
                </span>
                {showTagline && (
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase mt-1 bg-gradient-to-r from-[#C1172C] via-[#7F4D9F] to-[#22BFE8] bg-clip-text text-transparent">
                        ERP Platform
                    </span>
                )}
            </div>
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/* Page layout                                                           */
/* ------------------------------------------------------------------ */

interface AuthLayoutProps {
    children: React.ReactNode;
    /** Marketing-style side panel content (shown on lg+ screens). */
    aside?: React.ReactNode;
}

export function AuthLayout({ children, aside }: AuthLayoutProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#F4F6FB] via-white to-[#FBF7F4] text-gray-900">
            <AuthBackground />
            <div className="relative z-10 grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
                {/* Form column */}
                <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
                    <div className="w-full max-w-md">
                        <div className="mb-7 flex justify-center lg:justify-start">
                            <AuthBrand />
                        </div>
                        {children}
                        <p className="mt-8 text-center text-[11px] text-gray-400">
                            © {new Date().getFullYear()} Senyx ERP · Secure authentication powered by Supabase
                        </p>
                    </div>
                </div>
                {/* Marketing aside (lg+) */}
                {aside && (
                    <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-16 overflow-hidden">
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#C1172C] via-[#9B1022] to-[#7F4D9F]" />
                        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
                        <div className="absolute inset-0 -z-10 opacity-25 bg-[radial-gradient(circle_at_bottom_left,rgba(34,191,232,0.45),transparent_55%)]" />
                        <div className="relative text-white">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F9A01B]" />
                                Senyx ERP
                            </span>
                        </div>
                        <div className="relative">{aside}</div>
                        <p className="relative text-[11px] text-white/70">
                            Everything Senyx needs to run its operations, in one place.
                        </p>
                    </aside>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Card                                                                  */
/* ------------------------------------------------------------------ */

export function AuthCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative bg-white/95 backdrop-blur rounded-2xl border border-white/60 shadow-[0_18px_60px_-15px_rgba(15,23,42,0.18)] p-6 sm:p-8">
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Header (title + subtitle)                                            */
/* ------------------------------------------------------------------ */

export function AuthHeader({
    title,
    subtitle,
}: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
}) {
    return (
        <div className="mb-7">
            <h1 className="font-heading text-2xl font-extrabold text-gray-900 tracking-tight">
                {title}
            </h1>
            {subtitle && (
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{subtitle}</p>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Field                                                                */
/* ------------------------------------------------------------------ */

export interface AuthFieldProps {
    htmlFor: string;
    label: React.ReactNode;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    children: React.ReactNode;
}

export function AuthField({ htmlFor, label, hint, error, children }: AuthFieldProps) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={htmlFor}
                className="block text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500"
            >
                {label}
            </label>
            {children}
            {error ? (
                <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            ) : hint ? (
                <p className="text-[11px] text-gray-400">{hint}</p>
            ) : null}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                               */
/* ------------------------------------------------------------------ */

export const authInputClass =
    'block w-full h-11 px-3.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 transition-all outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50';

export function AuthInput({
    invalid,
    className,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
    return (
        <input
            className={cn(
                authInputClass,
                invalid && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20',
                className
            )}
            {...props}
        />
    );
}

/* ------------------------------------------------------------------ */
/* Submit button                                                        */
/* ------------------------------------------------------------------ */

export function AuthSubmitButton({
    isLoading,
    children,
}: {
    isLoading?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="submit"
            disabled={isLoading}
            className={cn(
                'group relative w-full h-11 rounded-xl text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(193,23,44,0.6)]',
                'bg-gradient-to-r from-[#C1172C] via-[#9B1022] to-[#7F4D9F] hover:from-[#9B1022] hover:via-[#7F4D9F] hover:to-[#C1172C]',
                'transition-all focus:outline-none focus:ring-2 focus:ring-[#C1172C]/40 focus:ring-offset-2',
                'disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2'
            )}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? 'Please wait…' : children}</span>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Banner (error / success)                                              */
/* ------------------------------------------------------------------ */

export function AuthBanner({
    tone = 'error',
    icon: Icon,
    children,
}: {
    tone?: 'error' | 'success';
    icon?: LucideIcon;
    children: React.ReactNode;
}) {
    const isError = tone === 'error';
    return (
        <div
            role={isError ? 'alert' : 'status'}
            className={cn(
                'rounded-xl border px-4 py-3 text-sm flex items-start gap-2',
                isError
                    ? 'bg-rose-50/80 border-rose-200 text-rose-700'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-700'
            )}
        >
            <span
                className={cn(
                    'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                    isError ? 'bg-rose-100' : 'bg-emerald-100'
                )}
            >
                {Icon ? (
                    <Icon className="w-3 h-3" />
                ) : isError ? (
                    <AlertCircle className="w-3 h-3" />
                ) : (
                    <CheckCircle2 className="w-3 h-3" />
                )}
            </span>
            <span className="text-[13px] leading-relaxed font-medium">{children}</span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Aside / marketing content                                            */
/* ------------------------------------------------------------------ */

export function AuthAside() {
    return (
        <div className="text-white max-w-lg space-auto">
            <h2 className="font-heading text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
                Manage Senyx from  one <span className="bg-gradient-to-r from-white via-[#F9A01B] to-white bg-clip-text text-transparent">central  workspace</span>.
            </h2>
            <p className="mt-5 text-base xl:text-lg text-white/85 leading-relaxed">
                A unified internal system for managing finance, HR, employees, projects, customers, sales,
                and day to day operations - keeping everything your team needs in one secure place.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/90">
                {[
                    'Real-time financial and business overview',
                    'Manage employees, customers, projects and deals',
                    'Department-based access and permissions',
                    'Centralized company data and records',
                    'Track activities and changes across the organization',
                ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F9A01B]" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Back link                                                            */
/* ------------------------------------------------------------------ */

export function AuthBackLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
            <ArrowLeft className="w-3.5 h-3.5" />
            {children}
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/* Icon helpers                                                         */
/* ------------------------------------------------------------------ */
export { Mail, Lock };