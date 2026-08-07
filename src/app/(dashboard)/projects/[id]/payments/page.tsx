'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  due: 'bg-amber-100 text-amber-800',
  invoiced: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
};

export default function ProjectPaymentsPage() {
  const { id } = useParams() as { id: string };
  const [milestones, setMilestones] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', phase: '', percentage: '', expectedDate: '' });
  const [saving, setSaving] = React.useState(false);

  const fetchMilestones = () => {
    fetch(`/api/projects/${id}/payment-milestones`)
      .then(r => r.json())
      .then(j => setMilestones(j.data || []))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchMilestones(); }, [id]);

  const totalPct = milestones.reduce((sum, m) => sum + Number(m.percentage), 0);
  const collectedAmt = milestones.filter(m => m.status === 'paid').reduce((s, m) => s + Number(m.amount), 0);
  const totalAmt = milestones.reduce((s, m) => s + Number(m.amount), 0);
  const collectedPct = totalAmt > 0 ? (collectedAmt / totalAmt) * 100 : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.percentage) { toast.error('Percentage is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}/payment-milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phase: form.phase || null,
          percentage: Number(form.percentage),
          expectedDate: form.expectedDate || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || json.error || 'Failed');
      setMilestones(prev => [...prev, json.data]);
      toast.success('Payment milestone created');
      setAddOpen(false);
      setForm({ name: '', phase: '', percentage: '', expectedDate: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-card border rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Revenue Collected</span>
          <span className="text-muted-foreground">{collectedPct.toFixed(0)}%</span>
        </div>
        <Progress value={collectedPct} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Collected: ${collectedAmt.toLocaleString()}</span>
          <span>Total: ${totalAmt.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Budget allocated: <strong>{totalPct.toFixed(0)}%</strong> / 100%
          {totalPct > 100 && <span className="text-destructive ml-2">⚠ Exceeds 100%</span>}
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)} disabled={totalPct >= 100}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Payment Milestone
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name / Phase</th>
              <th className="px-4 py-3 text-right">%</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Expected</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {milestones.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No payment milestones defined.
                </td>
              </tr>
            ) : milestones.map(m => (
              <tr key={m.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 text-muted-foreground">{m.sequence}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{m.name}</p>
                  {m.phase && <p className="text-xs text-muted-foreground">{m.phase}</p>}
                </td>
                <td className="px-4 py-3 text-right">{Number(m.percentage).toFixed(0)}%</td>
                <td className="px-4 py-3 text-right font-medium">
                  ${Number(m.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {m.expectedDate ? format(new Date(m.expectedDate), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_COLORS[m.status]}>{m.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Payment Milestone</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Phase (links to delivery milestone name)</Label>
              <Input
                placeholder="e.g. Phase 1 Delivery"
                value={form.phase}
                onChange={e => setForm({ ...form, phase: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Percentage (%)</Label>
                <Input
                  type="number" min={1} max={100 - totalPct} step={1}
                  placeholder={`Max ${100 - totalPct}%`}
                  value={form.percentage}
                  onChange={e => setForm({ ...form, percentage: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Expected Date</Label>
                <Input type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} />
              </div>
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
