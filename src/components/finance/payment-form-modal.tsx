'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PaymentFormModal({ 
  defaultInvoiceId, 
  defaultType = 'invoice',
  trigger
}: { 
  defaultInvoiceId?: string, 
  defaultType?: 'invoice' | 'expense',
  trigger?: React.ReactNode 
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [type, setType] = useState<'invoice' | 'expense'>(defaultType);
  const [targetId, setTargetId] = useState(defaultInvoiceId || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        invoiceId: type === 'invoice' ? targetId : null,
        expenseId: type === 'expense' ? targetId : null,
        amount,
        currency: 'USD',
        method,
        reference,
        paidAt: paidAt || null
      };

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to record payment');
      
      setIsOpen(false);
      if (!defaultInvoiceId) setTargetId('');
      setAmount('');
      setReference('');
      setPaidAt('');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error recording payment. Ensure the Invoice/Expense exists and is in the correct status.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    if (trigger) {
      return <div onClick={() => setIsOpen(true)} className="inline-block">{trigger}</div>;
    }
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Record Payment
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg shadow-xl border overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-heading font-semibold">Record Payment</h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment For</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full p-2 rounded-md border bg-background text-sm"
            >
              <option value="invoice">Client Invoice (Income)</option>
              <option value="expense">Vendor Expense (Outgoing)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {type === 'invoice' ? 'Invoice ID (UUID)' : 'Expense ID (UUID)'}
            </label>
            <input 
              required
              type="text" 
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              placeholder="e.g. 123e4567-e89b-12d3..."
              className="w-full p-2 rounded-md border bg-background text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (USD)</label>
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
              <label className="text-sm font-medium">Method</label>
              <select 
                required
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-sm"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online Portal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input 
                type="date" 
                value={paidAt}
                onChange={e => setPaidAt(e.target.value)}
                className="w-full p-2 rounded-md border bg-background text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference</label>
              <input 
                type="text" 
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Transaction ID..."
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
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
