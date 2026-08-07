'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { TaskDetailModal } from '@/components/board/task-detail-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function ProjectTasksPage() {
  const { id } = useParams() as { id: string };
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);

  const fetchTasks = () => {
    fetch(`/api/projects/${id}/tasks`)
      .then(r => r.json())
      .then(j => setTasks(j.data || []))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchTasks(); }, [id]);

  const handleCreate = async () => {
    const title = prompt('New task title:');
    if (!title?.trim()) return;
    try {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTasks(prev => [json.data, ...prev]);
      toast.success('Task created');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleCreate}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-right">Est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No tasks found.
                </td>
              </tr>
            ) : filtered.map(task => (
              <tr
                key={task.id}
                className="hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => setSelectedTask(task)}
              >
                <td className="px-4 py-3 font-medium">{task.title}</td>
                <td className="px-4 py-3">
                  <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {task.status.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {task.dueDate ? (
                    <span className={new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-destructive font-medium' : ''}>
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {task.estimateHours ? `${task.estimateHours}h` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => {
            if (updated === null) setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
            else setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...updated } : t));
            setSelectedTask(null);
          }}
          projectId={id}
        />
      )}
    </div>
  );
}
