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
import {
  FinancePageShell,
  FinanceStatCard,
  FinanceTable,
  FinanceAmount,
  FinanceStatusBadge,
  FinanceEmptyState,
  FinanceFilterBar,
  formatFinanceDate,
  daysOverdue,
  type FinanceTableColumn,
} from '@/components/finance/finance-shell';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Plus,
} from 'lucide-react';

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string | null;
  total: string | null;
  currency: string;
  dueDate: string | null;
  createdAt: string;
  accountName: string | null;
  projectName: string | null;
};

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

  const invoiceList = (await db.select({
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
    .orderBy(desc(invoices.createdAt))) as unknown as InvoiceRow[];

  // Preserve original aggregations
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let totalPaid = 0;
  const totalCount = invoiceList.length;
  invoiceList.forEach(inv => {
    const val = parseFloat(inv.total || '0');
    if (inv.status === 'sent') totalOutstanding += val;
    if (inv.status === 'overdue') {
      totalOutstanding += val;
      totalOverdue += val;
    }
    if (inv.status === 'paid') totalPaid += val;
  });

  const accountList = await db.select({ id: accounts.id, name: accounts.name }).from(accounts).orderBy(accounts.name);

  const columns: FinanceTableColumn<InvoiceRow>[] = [
    {
      id: 'invoiceNumber',
      header: 'Invoice #',
      width: 'w-[140px]',
      cell: (inv: InvoiceRow) => (
        <Link
          href={`/finance/invoices/${inv.id}`}
          className="text-sm font-semibold text-gray-900 hover:text-[#C1172C] truncate font-mono"
        >
          {inv.invoiceNumber}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: (inv: InvoiceRow) =>
        inv.accountName ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-8 w-8 rounded-lg bg-[#FCECEC] text-[#C1172C] flex items-center justify-center border border-[#F4BFC4] shrink-0 [&_svg]:w-4 [&_svg]:h-4">
              <Building2 className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                {inv.accountName}
              </div>
              {inv.projectName && (
                <div className="text-[11px] text-gray-400 truncate max-w-[200px]">{inv.projectName}</div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Unknown</span>
        ),
    },
    {
      id: 'project',
      header: 'Project',
      hideOn: 'sm',
      cell: (inv: InvoiceRow) =>
        inv.projectName ? (
          <span className="text-sm text-gray-600 truncate max-w-[200px] block">{inv.projectName}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      width: 'w-[160px]',
      cell: (inv: InvoiceRow) => (
        <FinanceAmount
          amount={parseFloat(inv.total || '0')}
          currency={inv.currency}
          tone={
            inv.status === 'paid'
              ? 'positive'
              : inv.status === 'overdue'
                ? 'negative'
                : inv.status === 'sent'
                  ? 'warning'
                  : 'neutral'
          }
        />
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: 'w-[130px]',
      cell: (inv: InvoiceRow) => <FinanceStatusBadge status={inv.status} />,
    },
    {
      id: 'dueDate',
      header: 'Due Date',
      width: 'w-[160px]',
      cell: (inv: InvoiceRow) => {
        if (!inv.dueDate) return <span className="text-xs text-gray-400">—</span>;
        const overdueDays = daysOverdue(inv.dueDate);
        const isOverdue = overdueDays !== null && overdueDays > 0 && inv.status !== 'paid' && inv.status !== 'void';
        return (
          <div className="inline-flex items-center gap-1.5">
            <CalendarClock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-gray-400'} shrink-0`} />
            <span
              className={
                'text-sm tabular-nums ' +
                (isOverdue ? 'text-rose-700 font-semibold' : 'text-gray-700')
              }
            >
              {formatFinanceDate(inv.dueDate)}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                {overdueDays}d
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-[140px]',
      cell: (inv: InvoiceRow) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/finance/invoices/${inv.id}`}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold text-gray-600 hover:text-[#C1172C] hover:bg-[#FCECEC] border border-gray-200 hover:border-[#F4BFC4] transition-colors"
          >
            View
          </Link>
          {inv.status === 'draft' && (
            <Link
              href={`/finance/invoices/${inv.id}/edit`}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold text-gray-600 hover:text-[#C1172C] hover:bg-[#FCECEC] border border-gray-200 hover:border-[#F4BFC4] transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <FinancePageShell
      pretitle="Finance"
      title="Invoices"
      description="Manage customer invoices, track statuses, and stay on top of receivables."
      actions={
        <Sheet>
          <SheetTrigger asChild>
            <Button className="gap-1.5 bg-[#C1172C] hover:bg-[#9B1022] text-white shadow-sm">
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[700px] overflow-hidden flex flex-col p-0">
            <SheetHeader className="px-6 py-6 border-b shrink-0">
              <SheetTitle>Create New Invoice</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 relative h-full">
              <InvoiceForm />
            </div>
          </SheetContent>
        </Sheet>
      }
      stats={
        <>
          <FinanceStatCard
            label="Total Invoices"
            value={<span className="text-2xl font-bold font-heading text-gray-900">{totalCount}</span>}
            hint="In this filter set"
            tone="neutral"
            icon={<FileText />}
          />
          <FinanceStatCard
            label="Outstanding"
            value={<FinanceAmount amount={totalOutstanding} tone="warning" bold={false} className="!text-2xl !font-bold !text-amber-700" />}
            hint="Sent invoices"
            tone="warning"
            icon={<CircleDollarSign />}
          />
          <FinanceStatCard
            label="Overdue"
            value={<FinanceAmount amount={totalOverdue} tone="negative" bold={false} className="!text-2xl !font-bold !text-rose-700" />}
            hint="Needs collection"
            tone="negative"
            icon={<AlertTriangle />}
          />
          <FinanceStatCard
            label="Paid"
            value={<FinanceAmount amount={totalPaid} tone="positive" bold={false} className="!text-2xl !font-bold !text-emerald-700" />}
            hint="Collected"
            tone="positive"
            icon={<CircleDollarSign />}
          />
        </>
      }
      toolbar={
        <FinanceFilterBar>
          <select
            name="status"
            defaultValue={(params.status as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
          >
            <option value="">Status: All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
          <select
            name="accountId"
            defaultValue={(params.accountId as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
          >
            <option value="">Client: All</option>
            {accountList.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <input
            type="date"
            name="startDate"
            defaultValue={(params.startDate as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
            title="Start Date"
          />
          <input
            type="date"
            name="endDate"
            defaultValue={(params.endDate as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
            title="End Date"
          />
          <input
            type="number"
            name="minAmount"
            defaultValue={(params.minAmount as string) || ''}
            placeholder="Min $"
            min="0"
            className="h-8 px-2.5 w-24 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
          />
          <input
            type="number"
            name="maxAmount"
            defaultValue={(params.maxAmount as string) || ''}
            placeholder="Max $"
            min="0"
            className="h-8 px-2.5 w-24 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
          />
          <button
            type="submit"
            className="h-8 px-3 rounded-md text-xs font-semibold bg-[#C1172C] text-white hover:bg-[#9B1022] transition-colors"
          >
            Filter
          </button>
          {Object.keys(params).length > 0 && (
            <Link
              href="/finance/invoices"
              className="h-8 px-3 inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </Link>
          )}
        </FinanceFilterBar>
      }
    >
      <FinanceTable
        columns={columns}
        rows={invoiceList}
        rowKey={r => r.id}
        emptyState={
          <FinanceEmptyState
            icon={<FileText />}
            title="No invoices found"
            description="Create your first invoice to start tracking receivables."
          />
        }
      />
    </FinancePageShell>
  );
}
