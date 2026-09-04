'use client';

import { useState, useEffect } from 'react';
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
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/invoices').then(res => res.json()).then(data => setInvoices(data.data || []));
      fetch('/api/expenses').then(res => res.json()).then(data => setExpenses(data.data || []));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetId) {
      alert(`Please select a valid ${type} before recording a payment.`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        invoiceId: type === 'invoice' ? targetId : null,
        expenseId: type === 'expense' ? targetId : null,
        amount,
        currency: 'USD',
        method,
        reference,
        paidAt: paidAt ? new Date(paidAt).toISOString() : null
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
              {type === 'invoice' ? 'Select Invoice' : 'Select Expense'}
            </label>
            <select 
              required
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              className="w-full p-2 rounded-md border bg-background text-sm"
              disabled={(type === 'invoice' && invoices.length === 0) || (type === 'expense' && expenses.length === 0)}
            >
              {type === 'invoice' && invoices.length === 0 && <option value="" disabled>No invoices available...</option>}
              {type === 'expense' && expenses.length === 0 && <option value="" disabled>No expenses available...</option>}
              {(type === 'invoice' && invoices.length > 0) || (type === 'expense' && expenses.length > 0) ? (
                <option value="" disabled>Select a record...</option>
              ) : null}
              {type === 'invoice' && invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  Invoice {inv.invoiceNumber} (${inv.total})
                </option>
              ))}
              {type === 'expense' && expenses.map(exp => (
                <option key={exp.id} value={exp.id}>
                  {exp.vendor} (${exp.amount})
                </option>
              ))}
            </select>
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
              disabled={loading || !targetId}
              className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 border-0 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
