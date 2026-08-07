'use client';
import { Bell, Check, Clock, FileText, UserPlus, FileEdit } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  // Pick top 5
  const recentNotifications = notifications.slice(0, 5);

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <UserPlus className="h-4 w-4" />;
      case 'due_date': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'approval': return <Check className="h-4 w-4 text-green-500" />;
      case 'status_change': return <FileEdit className="h-4 w-4 text-blue-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getLink = (notification: any) => {
    switch (notification.relatedType) {
      case 'project': return `/projects/${notification.relatedId}`;
      case 'task': return `/projects/${notification.relatedId}`; // would need project ID, but generic fallback
      case 'invoice': return `/finance/invoices/${notification.relatedId}`;
      default: return '#';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={() => markAllAsRead()}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="flex flex-col max-h-[300px] overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((n: any) => (
              <Link 
                key={n.id}
                href={getLink(n)}
                onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                className={`flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className="mt-0.5 rounded-full bg-background p-1 border shadow-sm shrink-0 h-7 w-7 flex items-center justify-center">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate" title={n.title}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>
        <div className="border-t p-2">
          <Button variant="ghost" className="w-full text-xs h-8" asChild>
            <Link href="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
