'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function ProjectTeamPage() {
  const { id } = useParams() as { id: string };
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ employeeId: '', roleOnProject: '', allocationPct: '' });
  const [saving, setSaving] = React.useState(false);

  const fetchAssignments = () => {
    fetch(`/api/projects/${id}/assignments`)
      .then(r => r.json())
      .then(j => setAssignments(j.data || []))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { 
    fetchAssignments(); 
    fetch('/api/employees')
      .then(r => r.json())
      .then(j => setEmployees(j.data || []))
      .catch(e => console.error("Failed to fetch employees", e));
  }, [id]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: form.employeeId,
          roleOnProject: form.roleOnProject || null,
          allocationPct: form.allocationPct ? Number(form.allocationPct) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to assign');
      toast.success('Team member assigned');
      setAddOpen(false);
      setForm({ employeeId: '', roleOnProject: '', allocationPct: '' });
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!confirm('Remove this team member from the project?')) return;
    try {
      const res = await fetch(`/api/projects/${id}/assignments/${assignmentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unassign');
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      toast.success('Team member removed');
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
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Member
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Employee Name</th>
              <th className="px-4 py-3 text-left">Role on Project</th>
              <th className="px-4 py-3 text-left">Allocation</th>
              <th className="px-4 py-3 text-left">Assigned At</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No team members assigned.</td>
              </tr>
            ) : assignments.map(a => (
              <tr key={a.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{a.employeeName || a.employeeId}</td>
                <td className="px-4 py-3">
                  {a.roleOnProject
                    ? <Badge variant="outline">{a.roleOnProject}</Badge>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {a.allocationPct ? `${a.allocationPct}%` : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(a.assignedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleUnassign(a.id)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Employee</Label>
              <Select
                value={form.employeeId}
                onValueChange={(val) => setForm({ ...form, employeeId: val })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Role on Project</Label>
              <Input
                placeholder="e.g. Developer, QA, Designer"
                value={form.roleOnProject}
                onChange={e => setForm({ ...form, roleOnProject: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Allocation %</Label>
              <Input
                type="number" min={0} max={100} step={5}
                placeholder="e.g. 50"
                value={form.allocationPct}
                onChange={e => setForm({ ...form, allocationPct: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Assign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
