'use client';
import { PageHeader } from '../../../components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { Bell, Check, Clock, FileText, UserPlus, FileEdit, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [type, setType] = useState('all');
  const [isRead, setIsRead] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { notifications, total, isLoading, markAllAsRead, markAsRead } = useNotifications({
    page,
    limit,
    ...(type !== 'all' && { type }),
    ...(isRead !== 'all' && { isRead: isRead === 'true' }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate })
  });

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'assignment': return <UserPlus className="h-5 w-5 text-indigo-500" />;
      case 'due_date': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'approval': return <Check className="h-5 w-5 text-green-500" />;
      case 'status_change': return <FileEdit className="h-5 w-5 text-blue-500" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getLink = (notification: any) => {
    switch (notification.relatedType) {
      case 'project': return `/projects/${notification.relatedId}`;
      case 'task': return `/projects/${notification.relatedId}`;
      case 'invoice': return `/finance/invoices/${notification.relatedId}`;
      default: return '#';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader title="Notification Center" description="View and manage all your automated alerts.">
        <Button variant="outline" onClick={() => markAllAsRead()}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Select value={type} onValueChange={(val) => { setType(val); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="assignment">Assignments</SelectItem>
            <SelectItem value="due_date">Due Dates</SelectItem>
            <SelectItem value="approval">Approvals</SelectItem>
            <SelectItem value="status_change">Status Changes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={isRead} onValueChange={(val) => { setIsRead(val); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="false">Unread Only</SelectItem>
            <SelectItem value="true">Read Only</SelectItem>
          </SelectContent>
        </Select>

        <Input 
          type="date" 
          placeholder="Start Date" 
          value={startDate} 
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }} 
        />
        <Input 
          type="date" 
          placeholder="End Date" 
          value={endDate} 
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }} 
        />
      </div>

      <Card>
        <CardContent className="p-0 flex flex-col divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length > 0 ? (
            notifications.map((n: any) => (
              <div 
                key={n.id} 
                className={`flex items-start gap-4 p-4 transition-colors ${!n.isRead ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <div className="mt-1 shrink-0 p-2 rounded-full bg-background border shadow-sm">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{n.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {n.body}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                      <Link href={getLink(n)}>View Details</Link>
                    </Button>
                    {!n.isRead && (
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-primary" onClick={() => markAsRead(n.id)}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No results found!</h3>
              <p className="text-muted-foreground">Try adjusting your filters.</p>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
