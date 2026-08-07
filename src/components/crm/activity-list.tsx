'use client';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

type Activity = {
  id: string;
  subject: string;
  type: string | null;
  dueDate: string | Date | null;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
};

export function ActivityList({ activities, onStatusToggle }: { activities: Activity[], onStatusToggle?: (id: string, status: string) => void }) {
  if (activities.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No activities scheduled.</div>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const date = activity.dueDate ? new Date(activity.dueDate) : null;
        const overdue = date && isPast(date) && !isToday(date) && activity.status !== 'done' && activity.status !== 'cancelled';
        const isDone = activity.status === 'done';

        return (
          <div key={activity.id} className={cn("flex items-start p-3 bg-card border rounded-lg transition-colors", isDone && "opacity-60")}>
            <button 
              className="mt-0.5 mr-3 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => onStatusToggle?.(activity.id, isDone ? 'open' : 'done')}
            >
              {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", isDone && "line-through")}>
                {activity.subject}
              </p>
              {date && (
                <div className={cn("flex items-center text-xs mt-1", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                  <Clock className="w-3 h-3 mr-1" />
                  {format(date, 'MMM d, yyyy')}
                  {overdue && <span className="ml-2 uppercase text-[10px] bg-destructive/10 px-1.5 py-0.5 rounded">Overdue</span>}
                </div>
              )}
            </div>
            {activity.type && (
              <span className="ml-3 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {activity.type}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
