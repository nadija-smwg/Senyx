'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckSquare2, Clock, Trash2, PlusCircle, Loader2 } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

interface TaskDetailModalProps {
  task: any;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: any) => void;
  projectId: string;
}

export function TaskDetailModal({ task, open, onClose, onUpdated, projectId }: TaskDetailModalProps) {
  const [form, setForm] = React.useState<any>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [timeEntries, setTimeEntries] = React.useState<any[]>([]);
  const [subtasks, setSubtasks] = React.useState<any[]>([]);
  const [newSubtask, setNewSubtask] = React.useState('');
  const [addingSubtask, setAddingSubtask] = React.useState(false);

  React.useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        estimateHours: task.estimateHours ?? '',
        dueDate: task.dueDate || '',
        assigneeId: task.assigneeId || '',
      });
      // Fetch time entries for this task
      fetch(`/api/projects/${projectId}/time-entries?taskId=${task.id}`)
        .then(r => r.json())
        .then(j => setTimeEntries(j.data || []));
      // Fetch subtasks
      fetch(`/api/projects/${projectId}/tasks?parentTaskId=${task.id}`)
        .then(r => r.json())
        .then(j => setSubtasks(j.data || []));
    }
  }, [task, projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimateHours: form.estimateHours ? Number(form.estimateHours) : null,
          assigneeId: form.assigneeId || null,
          dueDate: form.dueDate || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save task');
      toast.success('Task updated');
      onUpdated(json.data);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      toast.success('Task deleted');
      onUpdated(null); // signal deletion
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtask, parentTaskId: task.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error('Failed to create subtask');
      setSubtasks(prev => [...prev, json.data]);
      setNewSubtask('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingSubtask(false);
    }
  };

  if (!task) return null;

  const totalTaskTime = timeEntries.reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Badge className={PRIORITY_COLORS[form.priority || 'medium']}>
              {(form.priority || 'medium').toUpperCase()}
            </Badge>
            <span className="truncate">{task.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Add a description..."
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estimate + Due Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Estimate (hours)</Label>
              <Input
                type="number"
                min={0}
                step={0.25}
                value={form.estimateHours}
                onChange={e => setForm({ ...form, estimateHours: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* Subtasks */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CheckSquare2 className="h-4 w-4" />
              Subtasks ({subtasks.length})
            </Label>
            <div className="space-y-1 pl-2">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-2 text-sm py-1">
                  <span className={`w-2 h-2 rounded-full ${st.status === 'done' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  <span className={st.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add subtask..."
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleAddSubtask} disabled={addingSubtask}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Time entries summary */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Logged — {totalTaskTime.toFixed(2)}h
            </Label>
            {timeEntries.length > 0 ? (
              <div className="space-y-1 pl-2 max-h-32 overflow-y-auto">
                {timeEntries.map(e => (
                  <div key={e.id} className="text-sm text-muted-foreground flex justify-between">
                    <span>{e.workDate}</span>
                    <span>{Number(e.hours).toFixed(2)}h {e.billable ? '💰' : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pl-2">No time logged on this task.</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center pt-4">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-1" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
