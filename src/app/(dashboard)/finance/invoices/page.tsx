export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { invoices } from '@/server/db/schema/finance';
import { accounts } from '@/server/db/schema/crm';
import { projects } from '@/server/db/schema/projects';
import { eq, isNull, desc, and, gte, lte } from 'drizzle-orm';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { InvoiceForm } from '@/components/finance/invoice-form';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'paid': return 'bg-green-100 text-green-800 border-green-200';
    case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
    case 'void': return 'bg-stone-800 text-stone-100 border-stone-900';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const statusFilter = params.status as string | undefined;
  const accountIdFilter = params.accountId as string | undefined;
  const startDate = params.startDate as string | undefined;
  const endDate = params.endDate as string | undefined;
  const minAmount = params.minAmount as string | undefined;
  const maxAmount = params.maxAmount as string | undefined;

  const conditions = [isNull(invoices.deletedAt)];
  if (statusFilter) conditions.push(eq(invoices.status, statusFilter));
  if (accountIdFilter) conditions.push(eq(invoices.accountId, accountIdFilter));
  if (startDate) conditions.push(gte(invoices.createdAt, new Date(startDate)));
  if (endDate) {
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    conditions.push(lte(invoices.createdAt, end));
  }
  if (minAmount) conditions.push(gte(invoices.total, minAmount));
  if (maxAmount) conditions.push(lte(invoices.total, maxAmount));

  const invoiceList = await db.select({
    id: invoices.id,
    invoiceNumber: invoices.invoiceNumber,
    status: invoices.status,
    total: invoices.total,
    currency: invoices.currency,
    dueDate: invoices.dueDate,
    createdAt: invoices.createdAt,
    accountName: accounts.name,
    projectName: projects.name
  })
  .from(invoices)
  .leftJoin(accounts, eq(invoices.accountId, accounts.id))
  .leftJoin(projects, eq(invoices.projectId, projects.id))
  .where(and(...conditions))
  .orderBy(desc(invoices.createdAt));

  let totalOutstanding = 0;
  let totalOverdue = 0;
  invoiceList.forEach(inv => {
    const val = parseFloat(inv.total || '0');
    if (inv.status === 'sent') totalOutstanding += val;
    if (inv.status === 'overdue') {
      totalOutstanding += val;
      totalOverdue += val;
    }
  });

  const formatCurrency = (val: string | number | null, currency: string = 'USD') => {
    const num = typeof val === 'string' ? parseFloat(val || '0') : (val || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  };

  const accountList = await db.select({ id: accounts.id, name: accounts.name }).from(accounts).orderBy(accounts.name);

  return (
    <div className="space-y-6">
      <PageHeader 
        pretitle="Finance"
        title="Invoices"
        description="Manage your incoming and outgoing invoices, track payments, and stay on top of your financials."
        actions={
          <Sheet>
            <SheetTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold transition-all hover:scale-105">
                Create Invoice
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[700px] overflow-hidden flex flex-col p-0">
              <SheetHeader className="px-6 py-6 border-b shrink-0">
                <SheetTitle className="text-2xl font-bold font-heading">Create New Invoice</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 relative h-full">
                <InvoiceForm />
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      {/* Totals Summary */}
      <div className="flex gap-6 mb-2">
        <div className="bg-blue-50 border border-blue-100 px-4 py-3 rounded-md">
          <p className="text-xs text-blue-600 font-semibold uppercase">Total Outstanding</p>
          <p className="text-xl font-bold text-blue-900">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 px-4 py-3 rounded-md">
          <p className="text-xs text-red-600 font-semibold uppercase">Total Overdue</p>
          <p className="text-xl font-bold text-red-900">{formatCurrency(totalOverdue)}</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
        {/* Simple Server-Side Filter */}
        <form method="GET" className="flex flex-wrap gap-3 mb-4 items-center print:hidden">
          <select name="status" defaultValue={(params.status as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground">
            <option value="">Status: All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
          <select name="accountId" defaultValue={(params.accountId as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground">
            <option value="">Client: All</option>
            {accountList.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <input type="date" name="startDate" defaultValue={(params.startDate as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground" title="Start Date" />
          <input type="date" name="endDate" defaultValue={(params.endDate as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground" title="End Date" />
          <input type="number" name="minAmount" defaultValue={(params.minAmount as string) || ''} placeholder="Min $" className="p-2 w-24 text-sm border rounded-md bg-background text-muted-foreground" min="0" />
          <input type="number" name="maxAmount" defaultValue={(params.maxAmount as string) || ''} placeholder="Max $" className="p-2 w-24 text-sm border rounded-md bg-background text-muted-foreground" min="0" />
          
          <button type="submit" className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80">Filter</button>
          {Object.keys(params).length > 0 && (
            <Link href="/finance/invoices" className="text-sm text-muted-foreground hover:underline">Clear</Link>
          )}
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">
                    <Link href={`/finance/invoices/${inv.id}`} className="hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{inv.accountName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.projectName || '-'}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(inv.total, inv.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(inv.status)}`}>
                      {inv.status?.toUpperCase() || 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link 
                      href={`/finance/invoices/${inv.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {invoiceList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No invoices found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
