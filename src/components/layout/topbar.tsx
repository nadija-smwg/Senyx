'use client';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../ui/button';
import { TimeClock } from '@/components/clock/time-clock';
import { NotificationBell } from './notification-bell';
import { MobileNav } from './mobile-nav';
import { usePathname } from 'next/navigation';

export function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Basic breadcrumb formatting from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumb = segments.length > 0 
    ? segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ')
    : 'Dashboard';

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40 shadow-sm shadow-slate-100/50">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="font-semibold text-lg text-slate-800 tracking-tight hidden md:block">
          {breadcrumb}
        </div>
      </div>
      <div className="flex items-center gap-5">
        <TimeClock />
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        <NotificationBell />
        <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full shadow-inner border border-slate-200">
          {user ? user.email.split('@')[0] : 'Guest'}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => logout()}
          className="text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all rounded-lg ml-2"
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
