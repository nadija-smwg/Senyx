'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ExpenseFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form State
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expenseDate, setExpenseDate] = useState('');
  const [projectId, setProjectId] = useState('');

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
      
      setIsOpen(false);
      setVendor('');
      setCategory('');
      setAmount('');
      setCurrency('USD');
      setExpenseDate('');
      setProjectId('');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error creating expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Add Expense
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg shadow-xl border overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-heading font-semibold">Log New Expense</h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <input 
              type="text" 
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder="Project UUID for attribution"
              className="w-full p-2 rounded-md border bg-background text-sm"
            />
          </div>



          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
