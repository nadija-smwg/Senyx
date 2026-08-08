'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CreateContactDialog } from '@/components/crm/create-contact-dialog';
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

export default function ContactsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchContacts = () => {
    setLoading(true);
    fetch('/api/contacts')
      .then(res => res.json())
      .then(d => {
        if (d.data) setData(d.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const columns = [
    {
      id: 'fullName',
      accessorFn: (row: any) => `${row.firstName} ${row.lastName || ''}`.trim(),
      header: 'Name',
      cell: ({ row }: any) => {
        const primary = row.original.isPrimary;
        return (
          <div className="font-medium text-primary">
            {row.original.firstName} {row.original.lastName}
            {primary && <span className="ml-2 text-[10px] uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">Primary</span>}
          </div>
        );
      }
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
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
        title="Contacts" 
        description="Manage the people linked to your client accounts."
      >
        <Button onClick={() => setIsCreateOpen(true)}>Add Contact</Button>
      </PageHeader>

      <CreateContactDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={fetchContacts}
      />

      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Search contacts..." 
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
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">Loading contacts...</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">No contacts found.</td></tr>
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
