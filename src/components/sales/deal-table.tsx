'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { format } from 'date-fns';

export function DealTable({ deals }: { deals: any[] }) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = [
    {
      accessorKey: 'name',
      header: 'Deal Name',
      cell: ({ row }: any) => (
        <Link href={`/sales/deals/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.getValue('name')}
        </Link>
      )
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }: any) => <span className="capitalize">{row.getValue('stage')}</span>
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: row.original.currency || 'USD' }).format(row.getValue('amount'))
    },
    {
      accessorKey: 'probability',
      header: 'Probability',
      cell: ({ row }: any) => `${row.getValue('probability')}%`
    },
    {
      accessorKey: 'expectedCloseDate',
      header: 'Close Date',
      cell: ({ row }: any) => row.getValue('expectedCloseDate') ? format(new Date(row.getValue('expectedCloseDate')), 'MMM d, yyyy') : '—'
    },
    {
      accessorKey: 'health',
      header: 'Health',
      cell: ({ row }: any) => {
        const risk = row.original.health?.riskFlag;
        return risk ? <Badge variant="destructive">At Risk</Badge> : <Badge variant="secondary">Healthy</Badge>;
      }
    }
  ];

  const table = useReactTable({
    data: deals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Search deals..." 
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">No deals found.</td></tr>
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
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
