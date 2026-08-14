'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form State
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expenseDate, setExpenseDate] = useState('');
  const [projectId, setProjectId] = useState('');

  const { data: projectsData, isLoading: loadingProjects } = useSWR('/api/projects?scope=all', fetcher);
  const projects = projectsData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        vendor,
        category,
        amount,
        currency,
        expenseDate,
        projectId: projectId || null,
      };

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create expense');
      
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error creating expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2 pb-24">
        <div className="space-y-2">
          <label className="text-sm font-medium">Vendor</label>
          <input 
            required
            type="text" 
            value={vendor}
            onChange={e => setVendor(e.target.value)}
            placeholder="e.g. AWS, Zoom, Delta Airlines"
            className="w-full p-2 rounded-md border bg-background text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select 
            required
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full p-2 rounded-md border bg-background text-sm"
          >
            <option value="">Select Category...</option>
            <option value="Software Subscriptions">Software Subscriptions</option>
            <option value="Travel">Travel</option>
            <option value="Meals & Entertainment">Meals & Entertainment</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Hardware">Hardware</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <input 
              required
              type="number" 
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-2 rounded-md border bg-background text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <select 
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full p-2 rounded-md border bg-background text-sm"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="LKR">LKR</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <input 
            required
            type="date" 
            value={expenseDate}
            onChange={e => setExpenseDate(e.target.value)}
            className="w-full p-2 rounded-md border bg-background text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Project (Optional)</label>
          <select 
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="w-full p-2 rounded-md border bg-background text-sm"
            disabled={loadingProjects}
          >
            <option value="">No Project</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background flex justify-end gap-3 z-10 mt-auto">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button 
          form="expense-form"
          type="submit" 
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Expense
        </Button>
      </div>
    </div>
  );
}
