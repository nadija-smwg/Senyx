'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function SubscriptionFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form State
  const [accountId, setAccountId] = useState('');
  const [productName, setProductName] = useState('');
  const [plan, setPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [interval, setInterval] = useState('monthly');
  const [startedAt, setStartedAt] = useState('');
  const [accountsList, setAccountsList] = useState<any[]>([]);

  // Fetch accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/accounts')
        .then(res => res.json())
        .then(data => setAccountsList(data.data || []))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        accountId,
        productName,
        plan: plan || null,
        amount,
        currency,
        interval,
        startedAt: new Date(startedAt).toISOString(),
      };

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create subscription');
      
      setIsOpen(false);
      setAccountId('');
      setProductName('');
      setPlan('');
      setAmount('');
      setCurrency('USD');
      setInterval('monthly');
      setStartedAt('');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error creating subscription.');
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
        Add Subscription
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg shadow-xl border overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-heading font-semibold">New Subscription</h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Client Account</label>
            <select 
              required
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full p-2 rounded-md border bg-background text-sm"
            >
              <option value="" disabled>Select an account...</option>
              {accountsList.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product / Service</label>
              <input 
                required
                type="text" 
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="e.g. Senyx AI Core"
                className="w-full p-2 rounded-md border bg-background text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Tier (Optional)</label>
              <input 
                type="text" 
                value={plan}
                onChange={e => setPlan(e.target.value)}
                placeholder="e.g. Enterprise"
                className="w-full p-2 rounded-md border bg-background text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Amount</label>
              <input 
                required
                type="number" 
                min="0"
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
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="LKR">LKR (Rs)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Interval</label>
              <select 
                required
                value={interval}
                onChange={e => setInterval(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input 
                required
                type="date" 
                value={startedAt}
                onChange={e => setStartedAt(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-sm"
              />
            </div>
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
              {loading ? 'Creating...' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
