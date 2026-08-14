'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DealForm } from '@/components/sales/deal-form';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

export function DealTable({ deals }: { deals: any[] }) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = [
    {
      accessorKey: 'name',
      header: 'Deal Name',
      cell: ({ row }: any) => {
        const deal = row.original;
        return (
          <Sheet>
            <SheetTrigger asChild>
              <button className="font-medium text-primary hover:underline bg-transparent border-none cursor-pointer text-left">
                {row.getValue('name')}
              </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold font-heading">Edit Deal</SheetTitle>
              </SheetHeader>
              <DealForm 
                initialData={{
                  id: deal.id,
                  name: deal.name,
                  accountId: deal.accountId,
                  amount: deal.amount,
                  currency: deal.currency,
                  expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
                  source: deal.source || '',
                }} 
              />
            </SheetContent>
          </Sheet>
        );
      }
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
        return risk ? <Badge variant="negative" className="font-semibold tracking-wide uppercase">At Risk</Badge> : <Badge variant="positive" className="font-semibold tracking-wide uppercase">Healthy</Badge>;
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

      <div className="border rounded-md bg-card overflow-auto max-h-[calc(100vh-250px)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">No deals found.</TableCell></TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
