'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

export default function ProjectMilestonesPage() {
  const { id } = useParams() as { id: string };
  const [milestones, setMilestones] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', description: '', dueDate: '' });
  const [saving, setSaving] = React.useState(false);

  const fetchMilestones = () => {
    fetch(`/api/projects/${id}/milestones`)
      .then(r => r.json())
      .then(j => setMilestones(j.data || []))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchMilestones(); }, [id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setMilestones(prev => [...prev, json.data]);
      toast.success('Milestone created');
      setAddOpen(false);
      setForm({ name: '', description: '', dueDate: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (msId: string) => {
    try {
      const res = await fetch(`/api/milestones/${msId}/complete`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete milestone');
      toast.success('Milestone completed! Payment milestone set to "due".');
      setMilestones(prev => prev.map(m =>
        m.id === msId ? { ...m, status: 'completed', completedAt: new Date().toISOString() } : m
      ));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-md bg-card">
          No milestones yet. Add one to get started.
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-6 space-y-6 pb-4">
          {milestones.map((ms, idx) => (
            <div key={ms.id} className="relative pl-8">
              <div className="absolute -left-[13px] top-1">
                {ms.status === 'completed'
                  ? <CheckCircle2 className="h-6 w-6 text-green-500 bg-background" />
                  : <Circle className="h-6 w-6 text-muted-foreground bg-background" />}
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{ms.name}</p>
                    {ms.description && (
                      <p className="text-sm text-muted-foreground mt-1">{ms.description}</p>
                    )}
                    {ms.dueDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Due: {format(new Date(ms.dueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                    {ms.completedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Completed: {format(new Date(ms.completedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={STATUS_COLOR[ms.status]}>{ms.status.replace('_', ' ')}</Badge>
                    {ms.status !== 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => handleComplete(ms.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Delivery Milestone</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
