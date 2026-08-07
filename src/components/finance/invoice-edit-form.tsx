'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function InvoiceEditForm({ 
  invoiceId, 
  initialData, 
  initialLineItems 
}: { 
  invoiceId: string;
  initialData: any;
  initialLineItems: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [accountId, setAccountId] = useState(initialData.accountId || '');
  const [projectId, setProjectId] = useState(initialData.projectId || '');
  const [dueDate, setDueDate] = useState(initialData.dueDate ? initialData.dueDate.split('T')[0] : '');
  const [taxRate, setTaxRate] = useState(0); // We'll compute it if tax > 0, but for simplicity let's do this:

  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialLineItems.length > 0 
      ? initialLineItems.map(li => ({
          id: li.id,
          description: li.description,
          quantity: parseFloat(li.quantity),
          unitPrice: parseFloat(li.unitPrice)
        }))
      : [{ id: '1', description: '', quantity: 1, unitPrice: 0 }]
  );

  useEffect(() => {
    // If there is tax, try to back-calculate the rate approximately for the UI.
    const st = parseFloat(initialData.subtotal || '0');
    const t = parseFloat(initialData.tax || '0');
    if (st > 0 && t > 0) {
      setTaxRate(Math.round((t / st) * 100));
    }
  }, [initialData]);

  const [accountsList, setAccountsList] = useState<{id: string, name: string}[]>([]);
  const [projectsList, setProjectsList] = useState<{id: string, name: string, accountId: string}[]>([]);

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(d => setAccountsList(d.data || []));
    fetch('/api/projects').then(r => r.json()).then(d => setProjectsList(d.data || []));
  }, []);

  const filteredProjects = projectsList.filter(p => p.accountId === accountId);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Math.random().toString(), description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        dueDate: dueDate || null,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        lineItems: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: (item.quantity * item.unitPrice).toString()
        }))
      };

      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update invoice');
      
      router.push(`/finance/invoices/${invoiceId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error updating invoice. Make sure it is still a draft.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Client Account (Read-Only)</label>
          <select disabled value={accountId} className="w-full p-2 rounded-md border bg-muted text-muted-foreground text-sm">
            <option value={accountId}>{accountsList.find(a => a.id === accountId)?.name || 'Loading...'}</option>
          </select>
          <p className="text-xs text-muted-foreground">Client and Project cannot be changed on an existing invoice.</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Due Date</label>
          <input 
            type="date" 
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full p-2 rounded-md border bg-background text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-semibold">Line Items</h3>
        </div>
        
        <div className="space-y-3">
          {lineItems.map((item) => (
            <div key={item.id} className="flex gap-3 items-start">
              <div className="flex-1">
                <input 
                  required
                  type="text" 
                  placeholder="Description" 
                  value={item.description}
                  onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                  className="w-full p-2 rounded-md border bg-background text-sm"
                />
              </div>
              <div className="w-24">
                <input 
                  required
                  type="number" 
                  min="1"
                  placeholder="Qty" 
                  value={item.quantity}
                  onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-md border bg-background text-sm"
                />
              </div>
              <div className="w-32">
                <input 
                  required
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="Unit Price" 
                  value={item.unitPrice}
                  onChange={e => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-md border bg-background text-sm"
                />
              </div>
              <div className="w-32 p-2 text-right font-medium text-sm bg-muted/50 rounded-md">
                ${(item.quantity * item.unitPrice).toFixed(2)}
              </div>
              <button 
                type="button" 
                onClick={() => removeLineItem(item.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                disabled={lineItems.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        <button 
          type="button" 
          onClick={addLineItem}
          className="text-sm text-primary font-medium hover:underline"
        >
          + Add Line Item
        </button>
      </div>

      <div className="border-t pt-4 space-y-3 w-1/2 ml-auto">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground">Tax Rate (%):</span>
          <input 
            type="number" 
            min="0"
            max="100"
            value={taxRate}
            onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
            className="w-20 p-1 rounded-md border bg-background text-right text-sm"
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax:</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t pt-6 flex justify-end gap-3">
        <button 
          type="button" 
          onClick={() => router.push(`/finance/invoices/${invoiceId}`)}
          className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

    </form>
  );
}
