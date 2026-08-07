'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ExpenseActions({ expenseId, status }: { expenseId: string, status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (decision: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to mark this expense as ${decision}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      if (!res.ok) throw new Error(`Failed to ${decision} expense`);
      router.refresh();
    } catch (e) {
      alert(`Error updating expense status.`);
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'pending') {
    return <span className="text-xs text-muted-foreground uppercase">{status}</span>;
  }

  return (
    <div className="flex gap-2 justify-end">
      <button 
        onClick={() => handleAction('approved')}
        disabled={loading}
        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
      >
        Approve
      </button>
      <button 
        onClick={() => handleAction('rejected')}
        disabled={loading}
        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
