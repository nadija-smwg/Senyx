'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ProjectFormProps {
  fromDealId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ fromDealId, onSuccess, onCancel }: ProjectFormProps) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [deal, setDeal] = React.useState<any>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);

  const [formData, setFormData] = React.useState({
    name: '',
    accountId: '',
    ownerId: '',
    type: 'internal',
    billingType: 'fixed',
    budget: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
  });
  const [selectedDevelopers, setSelectedDevelopers] = React.useState<string[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(json => {
        if (json.data) setAccounts(json.data);
      })
      .catch(console.error);

    fetch('/api/employees?minimal=true')
      .then(res => res.json())
      .then(json => {
        if (json.data) setEmployees(json.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!fromDealId) setLoading(false);
      });

    if (fromDealId) {
      fetch(`/api/deals/${fromDealId}`)
        .then(res => res.json())
        .then(json => {
          if (json.data) {
            setDeal(json.data);
            setFormData(prev => ({
              ...prev,
              name: json.data.name,
              accountId: json.data.accountId || '',
              budget: json.data.amount?.toString() || '',
            }));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [fromDealId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      toast.error('End date cannot be before start date');
      return;
    }
    setSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        accountId: formData.accountId || null,
        budget: formData.budget ? Number(formData.budget) : null,
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error?.message || json.error || 'Failed to create project');
      
      toast.success('Project created successfully!');
      
      // Assign developers
      for (const empId of selectedDevelopers) {
        await fetch(`/api/projects/${json.data.id}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: empId, roleOnProject: 'Developer', allocationPct: 100 }),
        }).catch(console.error); // Best effort
      }
      
      if (onSuccess) onSuccess();
      router.push(`/projects/${json.data.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <form id="project-form" onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2 pb-24">
        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input 
            value={formData.name} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Budget (USD)</Label>
          <Input 
            type="number"
            value={formData.budget} 
            onChange={e => setFormData({ ...formData, budget: e.target.value })} 
          />
        </div>

        <div className="space-y-2">
          <Label>Project Type</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value, accountId: e.target.value !== 'solution' ? '' : formData.accountId })}
          >
            <option value="solution">Solution Delivery</option>
            <option value="product">Product Development</option>
            <option value="internal">Internal</option>
          </select>
        </div>

        {formData.type === 'solution' && (
          <div className="space-y-2">
            <Label>Client Account</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.accountId}
              onChange={e => setFormData({ ...formData, accountId: e.target.value })}
              required
            >
              <option value="">Select an account...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Accountable Person (Owner)</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.ownerId}
            onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
          >
            <option value="">Select an owner...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Developers</Label>
          <div className="flex flex-col gap-2 p-2 border rounded-md max-h-40 overflow-y-auto bg-background">
            {employees.map(emp => (
              <label key={emp.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDevelopers.includes(emp.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedDevelopers([...selectedDevelopers, emp.id]);
                    else setSelectedDevelopers(selectedDevelopers.filter(id => id !== emp.id));
                  }}
                />
                <span>{emp.firstName} {emp.lastName}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input 
              type="date"
              value={formData.startDate} 
              onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input 
              type="date"
              value={formData.endDate} 
              onChange={e => setFormData({ ...formData, endDate: e.target.value })} 
            />
          </div>
        </div>
      </form>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background flex justify-end gap-3 z-10 mt-auto">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button form="project-form" type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </div>
  );
}
