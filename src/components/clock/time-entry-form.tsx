'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface TimeEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: (entry: any) => void;
  projectId: string;
  tasks?: any[];
}

export function TimeEntryForm({ open, onClose, onSaved, projectId, tasks = [] }: TimeEntryFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = React.useState({
    taskId: '',
    workDate: today,
    hours: '',
    description: '',
    billable: true,
  });
  const [saving, setSaving] = React.useState(false);

  // Reset when dialog opens
  React.useEffect(() => {
    if (open) {
      setForm({ taskId: '', workDate: today, hours: '', description: '', billable: true });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = Number(form.hours);
    if (!hours || hours <= 0 || hours > 24) {
      toast.error('Hours must be between 0.25 and 24');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: form.taskId || null,
          workDate: form.workDate,
          hours,
          description: form.description,
          billable: form.billable,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to log time');
      toast.success('Time logged successfully');
      onSaved(json.data);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tasks.length > 0 && (
            <div className="space-y-1">
              <Label>Task (optional)</Label>
              <Select value={form.taskId} onValueChange={v => setForm({ ...form, taskId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a task..." /></SelectTrigger>
                <SelectContent>
                  {tasks.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.workDate}
              max={today}
              onChange={e => setForm({ ...form, workDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Hours</Label>
            <Input
              type="number"
              step={0.25}
              min={0.25}
              max={24}
              placeholder="e.g. 2.5"
              value={form.hours}
              onChange={e => setForm({ ...form, hours: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="What did you work on?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="billable-toggle">Billable</Label>
            <Switch
              id="billable-toggle"
              checked={form.billable}
              onCheckedChange={v => setForm({ ...form, billable: v })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Log Time
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
