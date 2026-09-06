"use client";

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Users,
  FolderKanban,
  Building2,
  Contact2,
  Settings,
  Shield,
  ClipboardList,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Module cards config                                                 */
/* ------------------------------------------------------------------ */

interface ModuleCard {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  accentColor: string;
  /** If set, only users with one of these roles (or Admin) can see this card. */
  visibleTo?: string[];
}

const MODULES: ModuleCard[] = [
  {
    title: 'Employees',
    description: 'Manage your team members, profiles, and organization structure.',
    href: '/hr/employees',
    icon: Users,
    gradient: 'from-violet-500/10 via-purple-500/5 to-transparent',
    iconBg: 'bg-violet-50',
    accentColor: '#7F4D9F',
    // All roles can see Employees
  },
  {
    title: 'Leave Management',
    description: 'Track leave requests, balances, and attendance records.',
    href: '/hr/leave',
    icon: ClipboardList,
    gradient: 'from-purple-500/10 via-fuchsia-500/5 to-transparent',
    iconBg: 'bg-purple-50',
    accentColor: '#7F4D9F',
    // All roles can see Leave
  },
  {
    title: 'Accounts',
    description: 'Manage client and vendor accounts for your business.',
    href: '/crm/accounts',
    icon: Building2,
    gradient: 'from-orange-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-orange-50',
    accentColor: '#F15A22',
    visibleTo: ['Admin', 'Sales Lead'],
  },
  {
    title: 'Contacts',
    description: 'Organize contacts and maintain business relationships.',
    href: '/crm/contacts',
    icon: Contact2,
    gradient: 'from-orange-400/10 via-red-500/5 to-transparent',
    iconBg: 'bg-orange-50',
    accentColor: '#F15A22',
    visibleTo: ['Admin', 'Sales Lead'],
  },
  {
    title: 'Projects',
    description: 'Plan, track, and deliver projects with your team.',
    href: '/projects',
    icon: FolderKanban,
    gradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
    iconBg: 'bg-emerald-50',
    accentColor: '#059669',
    // All roles can see Projects
  },
  {
    title: 'Settings',
    description: 'Configure your workspace, roles, and preferences.',
    href: '/settings',
    icon: Settings,
    gradient: 'from-gray-500/10 via-slate-500/5 to-transparent',
    iconBg: 'bg-gray-50',
    accentColor: '#3B3B3B',
    visibleTo: ['Admin', 'HR Manager'],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/* ------------------------------------------------------------------ */
/*  Module Card Component                                               */
/* ------------------------------------------------------------------ */

function ModuleCardItem({ card }: { card: ModuleCard }) {
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-white border border-gray-100",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-gray-200",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1"
      )}
    >
      {/* Top accent line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] transition-all duration-300 group-hover:h-[3px]"
        style={{ backgroundColor: card.accentColor, opacity: 0.75 }}
      />

      {/* Gradient background */}
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-70 transition-opacity duration-300", card.gradient)} />

      <div className="relative flex flex-col flex-1 p-5">
        {/* Icon + Arrow */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center",
              "transition-all duration-300",
              "group-hover:scale-110 group-hover:shadow-md",
              card.iconBg
            )}
          >
            <Icon className="w-5 h-5" style={{ color: card.accentColor }} />
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5 transition-colors group-hover:text-gray-950">
          {card.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-gray-500 flex-1">
          {card.description}
        </p>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function WelcomePage() {
  const { user, roles } = useAuth();
  const [now, setNow] = useState(new Date());

  const isAdmin = roles.includes('Admin');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = getGreeting();
  const username = user?.email?.split('@')[0] || 'there';

  // Capitalize first letter of username
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  // Build the full module list including role-specific extras
  const extraCards: ModuleCard[] = [];

  if (roles.includes('Admin') || roles.includes('HR Manager')) {
    extraCards.push({
      title: 'Approval Center',
      description: 'Review and approve pending leave and expense requests.',
      href: '/hr/approval',
      icon: CheckSquare,
      gradient: 'from-indigo-500/10 via-violet-500/5 to-transparent',
      iconBg: 'bg-indigo-50',
      accentColor: '#7F4D9F',
    });
  }

  if (roles.includes('Admin') || roles.includes('Auditor')) {
    extraCards.push({
      title: 'Audit Logs',
      description: 'Track all system activity and security events.',
      href: '/audit',
      icon: Shield,
      gradient: 'from-slate-500/10 via-gray-500/5 to-transparent',
      iconBg: 'bg-slate-50',
      accentColor: '#3B3B3B',
    });
  }

  // Filter base modules by role, then append role-specific extras
  const allModules = [
    ...MODULES.filter(card => {
      if (!card.visibleTo) return true;
      if (isAdmin) return true;
      return card.visibleTo.some(r => roles.includes(r));
    }),
    ...extraCards,
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] animate-in fade-in duration-500">
      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-8">
        {/* Decorative gradient blobs */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#22BFE8]/8 via-[#1A6DB6]/5 to-transparent" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#7F4D9F]/6 via-[#3E308E]/3 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-gradient-to-r from-[#F9A01B]/3 via-transparent to-[#22BFE8]/3" />
        </div>

        <div className="relative px-8 py-10 md:px-12 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            {/* Left: Greeting */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#F9A01B]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1A6DB6]">
                  {greeting}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 tracking-tight mb-3">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-[#1A6DB6] via-[#22BFE8] to-[#3E308E] bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>

              <p className="text-[15px] text-gray-500 leading-relaxed max-w-lg">
                Here's your workspace. Navigate to any module below to manage your
                organization, track projects, and stay on top of operations.
              </p>
            </div>

            {/* Right: Date & Time Card */}
            <div className="shrink-0">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 px-6 py-5 min-w-[220px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-[#1A6DB6]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    Today
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700 mb-3">
                  {formatDate(now)}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Clock className="w-3.5 h-3.5 text-[#7F4D9F]" />
                  <span className="text-lg font-heading font-bold text-gray-900 tabular-nums tracking-tight">
                    {formatTime(now)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  QUICK ACCESS MODULES                                         */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
              Quick Access
            </h2>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {allModules.length} modules
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allModules.map((card) => (
            <ModuleCardItem key={card.href} card={card} />
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  FOOTER BRANDING                                              */}
      {/* ============================================================ */}
      <div className="flex items-center justify-center py-8 opacity-40 hover:opacity-60 transition-opacity duration-300">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-icon-transparent.png"
            alt="Senyx"
            width={28}
            height={28}
            className="object-contain"
          />
          <div className="text-[11px] font-medium text-gray-400 tracking-wide">
            Senyx ERP Platform — Your business, streamlined.
          </div>
        </div>
      </div>
    </div>
  );
}
