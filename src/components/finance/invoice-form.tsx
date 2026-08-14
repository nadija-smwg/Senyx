'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
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

  // Computations
  const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        accountId,
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
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto pr-2 pb-24">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Client Account ID</label>
            <select 
              required
              value={accountId}
              onChange={e => {
                setAccountId(e.target.value);
                setProjectId('');
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
              <div key={item.id} className="flex gap-2 items-start flex-wrap sm:flex-nowrap">
                <div className="flex-1 w-full sm:w-auto">
                  <input 
                    required
                    type="text" 
                    placeholder="Description" 
                    value={item.description}
                    onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                    className="w-full p-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="w-20">
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
                <div className="w-24">
                  <input 
                    required
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="Price" 
                    value={item.unitPrice}
                    onChange={e => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="w-24 p-2 text-right font-medium text-sm bg-muted/50 rounded-md truncate">
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

        <div className="border-t pt-4 space-y-3 sm:w-2/3 ml-auto">
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
          form="invoice-form"
          type="submit" 
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Draft
        </Button>
      </div>
    </div>
  );
}
