'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDealId = searchParams?.get('fromDeal');

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [deal, setDeal] = React.useState<any>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);

  const [formData, setFormData] = React.useState({
    name: '',
    accountId: '',
    type: 'internal',
    billingType: 'fixed',
    budget: '',
  });

  React.useEffect(() => {
    // Fetch accounts for the dropdown
    fetch('/api/crm/accounts')
      .then(res => res.json())
      .then(json => {
        if (json.data) setAccounts(json.data);
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
    setSubmitting(true);
    
    try {
      // Clean up empty strings for optional fields
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
      router.push(`/projects/${json.data.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            {fromDealId ? 'Convert won deal into an active project' : 'Start a new project from scratch'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="pt-4 flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
