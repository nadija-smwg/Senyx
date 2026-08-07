'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TimeEntryForm } from '@/components/clock/time-entry-form';

export default function ProjectTimePage() {
  const { id } = useParams() as { id: string };
  const [entries, setEntries] = React.useState<any[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);

  const fetchEntries = () => {
    Promise.all([
      fetch(`/api/projects/${id}/time-entries`).then(r => r.json()),
      fetch(`/api/projects/${id}/tasks`).then(r => r.json()),
    ]).then(([timeJson, taskJson]) => {
      setEntries(timeJson.data || []);
      setTasks(taskJson.data || []);
    }).finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchEntries(); }, [id]);

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + Number(e.hours), 0);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Totals summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Hours', value: `${totalHours.toFixed(2)}h`, color: 'text-foreground' },
          { label: 'Billable Hours', value: `${billableHours.toFixed(2)}h`, color: 'text-primary' },
          { label: 'Non-billable', value: `${(totalHours - billableHours).toFixed(2)}h`, color: 'text-muted-foreground' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Log Time
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Billable</th>
              <th className="px-4 py-3 text-right">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No time entries yet.
                </td>
              </tr>
            ) : entries.map(entry => (
              <tr key={entry.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  {format(new Date(entry.workDate), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {entry.employeeId?.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-muted-foreground">{entry.description || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={entry.billable ? 'default' : 'secondary'}>
                    {entry.billable ? 'Billable' : 'Non-bill.'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {Number(entry.hours).toFixed(2)}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TimeEntryForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(entry) => setEntries(prev => [entry, ...prev])}
        projectId={id}
        tasks={tasks}
      />
    </div>
  );
}
