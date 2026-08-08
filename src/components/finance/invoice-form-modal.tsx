'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function InvoiceFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form State
  const [accountId, setAccountId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);

  const [accountsList, setAccountsList] = useState<{id: string, name: string}[]>([]);
  const [projectsList, setProjectsList] = useState<{id: string, name: string, accountId: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/accounts').then(r => r.json()).then(d => setAccountsList(d.data || []));
      fetch('/api/projects').then(r => r.json()).then(d => setProjectsList(d.data || []));
      fetch('/api/settings').then(r => r.json()).then(d => {
        const settings = d.data || [];
        const taxSetting = settings.find((s: any) => s.key === 'invoice.tax_rate');
        if (taxSetting) {
          const val = parseFloat(JSON.parse(taxSetting.value));
          if (!isNaN(val)) setTaxRate(val);
        }
      }).catch(e => console.error("Failed to fetch settings", e));
    }
  }, [isOpen]);

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

  // Computations
  const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        accountId, // Need an account selector in real app
        projectId: projectId || null,
        dueDate: dueDate || null,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        currency,
        lineItems: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: (item.quantity * item.unitPrice).toString()
        }))
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create invoice');
      
      const { data } = await res.json();
      setIsOpen(false);
      router.refresh();
      // Optional: router.push(`/finance/invoices/${data.id}`)
    } catch (error) {
      console.error(error);
      alert('Error creating invoice');
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
        Create Invoice
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground w-full max-w-3xl rounded-lg shadow-xl border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-heading font-semibold">Create New Invoice</h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Account ID</label>
                <select 
                  required
                  value={accountId}
                  onChange={e => {
                    setAccountId(e.target.value);
                    setProjectId(''); // reset project on account change
                  }}
                  className="w-full p-2 rounded-md border bg-background text-sm"
                >
                  <option value="">Select Account...</option>
                  {accountsList.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project (Optional)</label>
                <select 
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  disabled={!accountId}
                  className="w-full p-2 rounded-md border bg-background text-sm disabled:opacity-50"
                >
                  <option value="">Select Project...</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
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

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="text-sm font-semibold">Line Items</h3>
              </div>
              
              <div className="space-y-3">
                {lineItems.map((item, index) => (
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
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.quantity * item.unitPrice)}
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
                <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(subtotal)}</span>
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
                <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total)}</span>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t bg-muted/30 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button 
            form="invoice-form"
            type="submit" 
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
