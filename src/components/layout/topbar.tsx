'use client';
import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';
import { TimeClock } from '@/components/clock/time-clock';
import { NotificationBell } from './notification-bell';
import { MobileNav } from './mobile-nav';
import { CurrencySelector } from './currency-selector';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/': 'Dashboard',
    '/analytics': 'Analytics',
    '/analytics/reports': 'Reports',
    '/crm/accounts': 'Accounts',
    '/crm/contacts': 'Contacts',
    '/sales/deals': 'Deals',
    '/sales/quotes': 'Quotes',
    '/finance': 'Finance Overview',
    '/finance/invoices': 'Invoices',
    '/finance/expenses': 'Expenses',
    '/finance/payments': 'Payments',
    '/finance/subscriptions': 'Subscriptions',
    '/projects': 'Projects',
    '/hr/employees': 'Employees',
    '/hr/leave': 'Leave Requests',
    '/hr/departments': 'Departments',
    '/hr/designations': 'Designations',
    '/settings': 'Settings',
    '/settings/general': 'General Settings',
    '/settings/roles': 'Roles & Permissions',
    '/audit': 'Audit Logs',
    '/audit/analytics': 'Audit Analytics',
    '/audit/sessions': 'Active Sessions',
    '/help': 'Help Center',
    '/notifications': 'Notifications',
  };
  if (map[pathname]) return map[pathname];
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key !== '/' && pathname.startsWith(key)) return map[key] ?? 'Dashboard';
  }
  const seg = pathname.split('/').filter(Boolean).pop();
  if (seg) return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
  return 'Dashboard';
}

export function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const initials = user ? user.email.slice(0, 2).toUpperCase() : 'GU';
  const username = user ? user.email.split('@')[0] : 'Guest';

  return (
    <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-40" style={{
      backgroundColor: 'rgba(248,249,252,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E5E7EB',
    }}>
      {/* Left */}
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="font-heading font-bold text-xl text-gray-900 tracking-tight hidden md:block">{pageTitle}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-3">
          <CurrencySelector />
          <TimeClock />
          <div className="h-5 w-px bg-gray-200 mx-1" />
        </div>
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/30">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-[11px]" style={{
                background: 'linear-gradient(135deg, #22BFE8, #1A6DB6)',
              }}>
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{username}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52" align="end">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs" style={{
                  background: 'linear-gradient(135deg, #22BFE8, #1A6DB6)',
                }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-none">{username}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email || 'Not signed in'}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings/profile">Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings/general">Preferences</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
