'use client';

/**
 * Shared visual shell for the public authentication pages.
 *
 * Light, calm design — consistent with the dashboard aesthetic.
 * Uses Senyx company logos from /public.
 * No authentication logic is changed by this file.
 */

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    primary: '#1A6DB6',     // Blue — matches the calm dashboard
    primaryTint: '#F0F9FF',
    deep: '#155A96',
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
            {/* Subtle gradient blobs — light and calm */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
            >
                <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[#22BFE8]/6 blur-[140px]" />
                <div className="absolute -top-20 right-[-10%] h-[480px] w-[480px] rounded-full bg-[#7F4D9F]/5 blur-[140px]" />
                <div className="absolute bottom-[-20%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[#1A6DB6]/5 blur-[160px]" />
                <div className="absolute bottom-[-10%] left-[-15%] h-[480px] w-[480px] rounded-full bg-[#F9A01B]/4 blur-[160px]" />
            </div>
            {/* Subtle dotted grid texture */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.12) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }}
            />
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Brand mark — uses Senyx company logos                                 */
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
            <Image
                src="/logo-icon-transparent.png"
                alt="Senyx"
                width={isCompact ? 44 : 56}
                height={isCompact ? 44 : 56}
                className={cn(
                    'object-contain transition-transform duration-300 group-hover:scale-105',
                    isCompact ? 'h-11 w-11' : 'h-14 w-14'
                )}
                priority
            />
            <div className="flex flex-col justify-center leading-tight">
                <Image
                    src="/name-transparent.png"
                    alt="SENYX"
                    width={isCompact ? 100 : 120}
                    height={isCompact ? 30 : 36}
                    className={cn(
                        'object-contain object-left',
                        isCompact ? 'h-7' : 'h-9'
                    )}
                    priority
                />
                {showTagline && (
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5 text-[#1A6DB6]">
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
        <div className="relative min-h-screen w-full overflow-hidden bg-[#F8F9FC] text-gray-900">
            <AuthBackground />
            <div className="relative z-10 grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
                {/* Form column */}
                <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex justify-center lg:justify-start">
                            <AuthBrand />
                        </div>
                        {children}
                        <p className="mt-8 text-center text-[11px] text-gray-400">
                            © {new Date().getFullYear()} Senyx ERP · Secure authentication powered by Supabase
                        </p>
                    </div>
                </div>
                {/* Aside panel (lg+) */}
                {aside && (
                    <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-16 overflow-hidden">
                        {/* Light gradient background instead of heavy red/purple */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F0F9FF] via-white to-[#F2E8FA]/30" />
                        {/* Decorative subtle blobs */}
                        <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#22BFE8]/8 via-[#1A6DB6]/5 to-transparent" />
                            <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#7F4D9F]/6 via-[#3E308E]/3 to-transparent" />
                        </div>
                        {/* Senyx badge */}
                        <div className="relative">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-gray-100 px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1A6DB6]" />
                                Senyx ERP
                            </span>
                        </div>
                        {/* Content */}
                        <div className="relative">{aside}</div>
                        {/* Footer */}
                        <div className="relative flex items-center gap-3 opacity-50">
                            <Image
                                src="/logo-icon-transparent.png"
                                alt="Senyx"
                                width={20}
                                height={20}
                                className="object-contain"
                            />
                            <p className="text-[11px] text-gray-500">
                                Everything your team needs, in one place.
                            </p>
                        </div>
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
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8">
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
            <h1 className="font-heading text-2xl font-bold text-gray-900 tracking-tight">
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
    'block w-full h-11 px-3.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 transition-all outline-none focus:border-[#1A6DB6] focus:ring-2 focus:ring-[#22BFE8]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50';

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
                'group relative w-full h-11 rounded-xl text-sm font-semibold text-white',
                'bg-[#1A6DB6] hover:bg-[#155A96]',
                'shadow-[0_4px_16px_-4px_rgba(26,109,182,0.4)]',
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#22BFE8]/40 focus:ring-offset-2',
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
        <div className="max-w-lg space-auto">
            <h2 className="font-heading text-4xl xl:text-5xl font-bold tracking-tight leading-tight text-gray-900">
                Your business,{' '}
                <span className="bg-gradient-to-r from-[#1A6DB6] via-[#22BFE8] to-[#7F4D9F] bg-clip-text text-transparent">
                    streamlined
                </span>
                .
            </h2>
            <p className="mt-5 text-base xl:text-lg text-gray-500 leading-relaxed">
                A unified internal system for managing HR, employees, projects, customers,
                and day-to-day operations — keeping everything your team needs in one secure place.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-gray-600">
                {[
                    'Manage employees, customers, projects and deals',
                    'Department-based access and permissions',
                    'Centralized company data and records',
                    'Track activities and changes across the organization',
                ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1A6DB6]" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>

            {/* Logo showcase */}
            <div className="mt-10 flex items-center gap-4">
                <Image
                    src="/logo-icon-transparent.png"
                    alt="Senyx"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain opacity-80"
                />
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-[11px] text-gray-400 leading-relaxed">
                    <span className="font-semibold text-gray-500">Trusted by your team</span>
                    <br />
                    Secure · Fast · Reliable
                </div>
            </div>
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