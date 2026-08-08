'use client';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { QuoteDocumentsModal } from '@/components/sales/quote-documents-modal';
import { toast } from 'sonner';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quotes')
      .then(res => res.json())
      .then(d => {
        if (d.data) setQuotes(d.data);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      accessorKey: 'id',
      header: 'Quote ID',
      cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.id.substring(0, 8)}...</span>
    },
    {
      accessorKey: 'dealId',
      header: 'Deal Reference',
      cell: ({ row }: any) => <span className="text-muted-foreground">{row.original.dealId}</span>
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: row.original.currency || 'USD' }).format(row.getValue('amount'))
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        return (
          <Badge variant={status === 'accepted' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'validUntil',
      header: 'Valid Until',
      cell: ({ row }: any) => row.getValue('validUntil') ? format(new Date(row.getValue('validUntil')), 'MMM d, yyyy') : '—'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex justify-end">
          <QuoteDocumentsModal quoteId={row.original.id} />
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: quotes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quotes" 
        description="Manage price quotes sent to prospects."
      >
        <Button onClick={() => toast('Quote creation not implemented yet')}>Create Quote</Button>
      </PageHeader>

      <div className="border rounded-md bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">Loading quotes...</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">No quotes generated yet.</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
