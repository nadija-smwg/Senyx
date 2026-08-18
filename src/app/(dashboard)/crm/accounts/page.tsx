'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AccountForm } from '@/components/crm/account-form';

export default function AccountsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(d => {
        if (d.data) setData(d.data);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      accessorKey: 'name',
      header: 'Account Name',
      cell: ({ row }: any) => {
        const acc = row.original;
        return (
          <Sheet>
            <SheetTrigger asChild>
              <button className="font-medium text-primary hover:underline text-left bg-transparent border-none cursor-pointer">
                {row.getValue('name')}
              </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold font-heading">Edit Account</SheetTitle>
              </SheetHeader>
              <AccountForm 
                initialData={{
                  id: acc.id,
                  name: acc.name,
                  industry: acc.industry || '',
                  size: acc.size || '',
                  website: acc.website || '',
                  status: acc.status || 'prospect',
                }}
                onSuccess={() => window.location.reload()}
              />
            </SheetContent>
          </Sheet>
        );
      }
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
    },
    {
      accessorKey: 'ownerName',
      header: 'Owner',
      cell: ({ row }: any) => {
        const name = row.getValue('ownerName');
        return <span className="text-muted-foreground">{name || 'Unassigned'}</span>;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const val = row.getValue('status');
        let variant: 'positive' | 'warning' | 'negative' | 'default' = 'default';
        if (val === 'active') variant = 'positive';
        else if (val === 'prospect') variant = 'warning';
        return (
          <Badge variant={variant} className="font-semibold tracking-wide uppercase">
            {val}
          </Badge>
        );
      }
    },
  ];

  const table = useReactTable({
    data,
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
    <div className="space-y-6">
      <PageHeader 
        title="Accounts" 
        description="Manage your CRM client accounts and prospects."
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button>Add Account</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold font-heading">Add Account</SheetTitle>
            </SheetHeader>
            <AccountForm onSuccess={() => window.location.reload()} />
          </SheetContent>
        </Sheet>
      </PageHeader>

      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Search accounts..." 
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
            {loading ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Loading accounts...</TableCell></TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">No accounts found.</TableCell></TableRow>
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
      
      {/* Pagination */}
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
