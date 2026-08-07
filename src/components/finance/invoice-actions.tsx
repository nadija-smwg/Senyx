'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentFormModal } from './payment-form-modal';

export function InvoiceActions({ invoiceId, status }: { invoiceId: string, status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleIssue = async () => {
    if (!confirm('Are you sure you want to issue this invoice? It will be marked as Sent.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/issue`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to issue invoice');
      router.refresh();
    } catch (e) {
      alert('Error issuing invoice. Make sure a due date is set.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!confirm('Are you sure you want to void this invoice? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/void`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to void invoice');
      router.refresh();
    } catch (e) {
      alert('Error voiding invoice. You cannot void a paid invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handlePrint}
        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print PDF
      </button>

      {status === 'draft' && (
        <button 
          onClick={() => router.push(`/finance/invoices/${invoiceId}/edit`)}
          className="px-4 py-2 bg-muted text-muted-foreground border rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          Edit
        </button>
      )}

      {status === 'draft' && (
        <button 
          onClick={handleIssue}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Issuing...' : 'Issue Invoice'}
        </button>
      )}

      {(status === 'draft' || status === 'sent' || status === 'overdue') && (
        <button 
          onClick={handleVoid}
          disabled={loading}
          className="px-4 py-2 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          Void
        </button>
      )}

      {(status === 'sent' || status === 'overdue') && (
        <PaymentFormModal 
          defaultInvoiceId={invoiceId} 
          defaultType="invoice"
          trigger={
            <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Record Payment
            </button>
          }
        />
      )}
    </>
  );
}
