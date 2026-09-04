'use client';

import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';
import { TimeClock } from '@/components/clock/time-clock';
import { NotificationBell } from './notification-bell';
import { MobileNav } from './mobile-nav';
import { CurrencySelector } from './currency-selector';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, User, Sliders, LifeBuoy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface PageMeta {
  title: string;
  module: string;
  moduleColor: string;
}

function getPageMeta(pathname: string): PageMeta {
  const map: Record<string, { title: string; module: string; moduleColor: string }> = {
    '/': { title: 'Dashboard', module: 'Core', moduleColor: '#1A6DB6' },
    '/analytics': { title: 'Analytics', module: 'Core', moduleColor: '#1A6DB6' },
    '/analytics/reports': { title: 'Reports', module: 'Analytics', moduleColor: '#1A6DB6' },
    '/crm/accounts': { title: 'Accounts', module: 'CRM & Sales', moduleColor: '#F15A22' },
    '/crm/contacts': { title: 'Contacts', module: 'CRM & Sales', moduleColor: '#F15A22' },
    '/sales/deals': { title: 'Deals', module: 'CRM & Sales', moduleColor: '#F15A22' },
    '/sales/quotes': { title: 'Quotes', module: 'CRM & Sales', moduleColor: '#F15A22' },
    '/finance': { title: 'Finance Overview', module: 'Finance', moduleColor: '#C1172C' },
    '/finance/invoices': { title: 'Invoices', module: 'Finance', moduleColor: '#C1172C' },
    '/finance/expenses': { title: 'Expenses', module: 'Finance', moduleColor: '#C1172C' },
    '/finance/payments': { title: 'Payments', module: 'Finance', moduleColor: '#C1172C' },
    '/finance/subscriptions': { title: 'Subscriptions', module: 'Finance', moduleColor: '#C1172C' },
    '/projects': { title: 'Projects', module: 'Projects', moduleColor: '#059669' },
    '/hr/employees': { title: 'Employees', module: 'HR & People', moduleColor: '#7F4D9F' },
    '/hr/leave': { title: 'Leave Requests', module: 'HR & People', moduleColor: '#7F4D9F' },
    '/hr/departments': { title: 'Departments', module: 'HR & People', moduleColor: '#7F4D9F' },
    '/hr/designations': { title: 'Designations', module: 'HR & People', moduleColor: '#7F4D9F' },
    '/hr/approval': { title: 'Approval Center', module: 'HR & People', moduleColor: '#7F4D9F' },
    '/settings': { title: 'Settings', module: 'System', moduleColor: '#7F4D9F' },
    '/settings/general': { title: 'General Settings', module: 'System', moduleColor: '#7F4D9F' },
    '/settings/profile': { title: 'Profile', module: 'System', moduleColor: '#7F4D9F' },
    '/settings/security': { title: 'Security', module: 'System', moduleColor: '#7F4D9F' },
    '/settings/roles': { title: 'Roles & Permissions', module: 'System', moduleColor: '#7F4D9F' },
    '/audit': { title: 'Audit Logs', module: 'Security', moduleColor: '#7F4D9F' },
    '/audit/analytics': { title: 'Audit Analytics', module: 'Security', moduleColor: '#7F4D9F' },
    '/audit/sessions': { title: 'Active Sessions', module: 'Security', moduleColor: '#7F4D9F' },
    '/help': { title: 'Help Center', module: 'Core', moduleColor: '#1A6DB6' },
    '/notifications': { title: 'Notifications', module: 'Core', moduleColor: '#1A6DB6' },
  };

  if (map[pathname]) return map[pathname] as PageMeta;

  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key !== '/' && pathname.startsWith(`${key}/`)) {
      return (map[key] as PageMeta) ?? { title: 'Dashboard', module: 'Core', moduleColor: '#1A6DB6' };
    }
  }
  const seg = pathname.split('/').filter(Boolean).pop();
  const title = seg ? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ') : 'Dashboard';
  return { title, module: 'Senyx', moduleColor: '#1A6DB6' };
}

export function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { title, module, moduleColor } = getPageMeta(pathname);

  // User type only has id/email/isActive — derive display from email
  const initials = user ? user.email.slice(0, 2).toUpperCase() : 'GU';
  const displayName = user?.email?.split('@')[0] || 'Guest';
  const email = user?.email || 'Not signed in';

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70"
    >
      {/* Left: mobile trigger + page title block */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav />
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: moduleColor }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: moduleColor }}
                aria-hidden
              />
              {module}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Module
            </span>
          </div>
          <h1 className="font-heading font-bold text-lg md:text-xl text-gray-900 tracking-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Currency + Clock-in (hidden on small) */}
        <div className="hidden md:flex items-center gap-1.5">
          <CurrencySelector />
          <TimeClock />
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block h-7 w-px bg-gray-200 mx-1" aria-hidden />

        {/* Notifications */}
        <NotificationBell />

        {/* Help shortcut */}
        <Link
          href="/help"
          className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/40 focus-visible:ring-offset-1"
          aria-label="Help"
          title="Help"
        >
          <LifeBuoy className="h-[18px] w-[18px]" />
        </Link>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open user menu"
              className={cn(
                'flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-lg border bg-white',
                'border-gray-200 hover:bg-gray-50 hover:border-gray-300',
                'transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/40 focus-visible:ring-offset-1'
              )}
            >
              <span
                className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[11px] shrink-0"
                style={{ background: 'linear-gradient(135deg, #22BFE8 0%, #1A6DB6 100%)' }}
                aria-hidden
              >
                {initials}
              </span>
              <span className="hidden md:flex flex-col items-start min-w-0 leading-tight">
                <span className="text-[13px] font-semibold text-gray-800 truncate max-w-[120px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-gray-400">Signed in</span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden md:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64 p-1" align="end" sideOffset={6}>
            <div className="px-2.5 py-2.5 flex items-center gap-2.5">
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg, #22BFE8 0%, #1A6DB6 100%)' }}
                aria-hidden
              >
                {initials}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-[13px] font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings/general" className="flex items-center gap-2">
                <Sliders className="h-4 w-4" /> Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
