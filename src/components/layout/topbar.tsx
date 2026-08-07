'use client';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../ui/button';
import { TimeClock } from '@/components/clock/time-clock';
import { NotificationBell } from './notification-bell';

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
      <div className="font-medium text-lg">
        {/* Breadcrumbs will go here */}
        Dashboard
      </div>
      <div className="flex items-center gap-4">
        <TimeClock />
        <NotificationBell />
        <div className="text-sm">
          {user ? user.email : 'Guest'}
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          Log out
        </Button>
      </div>
    </header>
  );
}
