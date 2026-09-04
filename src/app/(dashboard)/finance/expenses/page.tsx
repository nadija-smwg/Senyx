export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { expenses } from '@/server/db/schema/finance';
import { projects } from '@/server/db/schema/projects';
import { eq, isNull, desc, and, gte, lte } from 'drizzle-orm';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ExpenseForm } from '@/components/finance/expense-form';
import { Button } from '@/components/ui/button';
import { ExpenseActions } from '@/components/finance/expense-actions';
import { ExpenseDocumentsModal } from '@/components/finance/expense-documents-modal';
import {
  FinancePageShell,
  FinanceStatCard,
  FinanceTable,
  ExpenseStatusBadge,
  ExpenseCategoryBadge,
  FinanceAmount,
  FinanceEmptyState,
  formatFinanceDate,
  type FinanceTableColumn,
} from '@/components/finance/finance-shell';
import { CheckCircle2, FileText, Plus, Receipt, Wallet } from 'lucide-react';
import Link from 'next/link';

type ExpenseRow = {
  id: string;
  vendor: string;
  category: string;
  amount: string | null;
  currency: string;
  expenseDate: string;
  approvalStatus: string | null;
  projectName: string | null;
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const statusFilter = params.status as string | undefined;
  const categoryFilter = params.category as string | undefined;
  const projectIdFilter = params.projectId as string | undefined;
  const startDate = params.startDate as string | undefined;
  const endDate = params.endDate as string | undefined;

  const conditions = [isNull(expenses.deletedAt)];
  if (statusFilter) conditions.push(eq(expenses.approvalStatus, statusFilter));
  if (categoryFilter) conditions.push(eq(expenses.category, categoryFilter));
  if (projectIdFilter) conditions.push(eq(expenses.projectId, projectIdFilter));
  if (startDate) conditions.push(gte(expenses.expenseDate, startDate));
  if (endDate) {
    conditions.push(lte(expenses.expenseDate, endDate));
  }

  const projectList = await db.select({ id: projects.id, name: projects.name }).from(projects).orderBy(projects.name);

  const expenseList = (await db.select({
    id: expenses.id,
    vendor: expenses.vendor,
    category: expenses.category,
    amount: expenses.amount,
    currency: expenses.currency,
    expenseDate: expenses.expenseDate,
    approvalStatus: expenses.approvalStatus,
    projectName: projects.name
  })
    .from(expenses)
    .leftJoin(projects, eq(expenses.projectId, projects.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.expenseDate))) as ExpenseRow[];

  // Aggregates from the same data
  let totalAmount = 0;
  let pendingTotal = 0;
  let approvedTotal = 0;
  let reimbursedTotal = 0;
  expenseList.forEach(e => {
    const v = parseFloat(e.amount || '0');
    totalAmount += v;
    if (e.approvalStatus === 'pending') pendingTotal += v;
    if (e.approvalStatus === 'approved') approvedTotal += v;
    if (e.approvalStatus === 'reimbursed') reimbursedTotal += v;
  });

  const columns: FinanceTableColumn<ExpenseRow>[] = [
    {
      id: 'date',
      header: 'Date',
      cell: (e: ExpenseRow) => (
        <span className="text-sm text-gray-700 tabular-nums">{formatFinanceDate(e.expenseDate)}</span>
      ),
      width: 'w-[120px]',
    },
    {
      id: 'vendor',
      header: 'Vendor',
      cell: (e: ExpenseRow) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0 [&_svg]:w-4 [&_svg]:h-4">
            <Receipt className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">{e.vendor}</span>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: (e: ExpenseRow) => <ExpenseCategoryBadge category={e.category} />,
      hideOn: 'sm',
    },
    {
      id: 'project',
      header: 'Project',
      cell: (e: ExpenseRow) =>
        e.projectName ? (
          <span className="text-sm text-gray-600 truncate max-w-[200px] block">{e.projectName}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      hideOn: 'md',
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (e: ExpenseRow) => (
        <FinanceAmount amount={parseFloat(e.amount || '0')} currency={e.currency} tone="negative" />
      ),
      width: 'w-[160px]',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (e: ExpenseRow) => <ExpenseStatusBadge status={e.approvalStatus} />,
      width: 'w-[130px]',
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-[200px]',
      cell: (e: ExpenseRow) => (
        <div className="flex items-center justify-end gap-1.5">
          <ExpenseDocumentsModal expenseId={e.id} />
          <ExpenseActions expenseId={e.id} status={e.approvalStatus || 'pending'} />
        </div>
      ),
    },
  ];

  return (
    <FinancePageShell
      pretitle="Finance"
      title="Expenses"
      description="Track approved and pending expenses, log receipts, and manage reimbursements."
      actions={
        <Sheet>
          <SheetTrigger asChild>
            <Button className="gap-1.5 bg-[#C1172C] hover:bg-[#9B1022] text-white shadow-sm">
              <Plus className="w-4 h-4" />
              Log Expense
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[480px] overflow-hidden flex flex-col p-0">
            <SheetHeader className="px-6 py-6 border-b shrink-0">
              <SheetTitle>Log New Expense</SheetTitle>
              <SheetDescription>
                Record a vendor expense and attach receipts.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 relative h-full">
              <ExpenseForm />
            </div>
          </SheetContent>
        </Sheet>
      }
      stats={
        <>
          <FinanceStatCard
            label="Total Expenses"
            value={<FinanceAmount amount={totalAmount} tone="negative" bold={false} className="!text-2xl !font-bold !text-rose-700" />}
            hint="In this filter set"
            tone="negative"
            icon={<Wallet />}
          />
          <FinanceStatCard
            label="Pending Approval"
            value={<FinanceAmount amount={pendingTotal} tone="warning" bold={false} className="!text-2xl !font-bold !text-amber-700" />}
            hint={`${expenseList.filter(e => e.approvalStatus === 'pending').length} item${expenseList.filter(e => e.approvalStatus === 'pending').length === 1 ? '' : 's'}`}
            tone="warning"
            icon={<FileText />}
          />
          <FinanceStatCard
            label="Approved"
            value={<FinanceAmount amount={approvedTotal} tone="info" bold={false} className="!text-2xl !font-bold !text-sky-700" />}
            hint="Ready for reimbursement"
            tone="info"
            icon={<CheckCircle2 />}
          />
          <FinanceStatCard
            label="Reimbursed"
            value={<FinanceAmount amount={reimbursedTotal} tone="positive" bold={false} className="!text-2xl !font-bold !text-emerald-700" />}
            hint="Settled"
            tone="positive"
            icon={<CheckCircle2 />}
          />
        </>
      }
      toolbar={
        <form method="GET" className="flex flex-wrap items-center gap-2 w-full">
          <select
            name="status"
            defaultValue={(params.status as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
          >
            <option value="">Status: All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="reimbursed">Reimbursed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            name="category"
            defaultValue={(params.category as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
          >
            <option value="">Category: All</option>
            <option value="Travel">Travel</option>
            <option value="Meals">Meals</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Software">Software</option>
            <option value="Other">Other</option>
          </select>
          <select
            name="projectId"
            defaultValue={(params.projectId as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20 max-w-[180px]"
          >
            <option value="">Project: All</option>
            {projectList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
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
          <button
            type="submit"
            className="h-8 px-3 rounded-md text-xs font-semibold bg-[#C1172C] text-white hover:bg-[#9B1022] transition-colors"
          >
            Filter
          </button>
          {Object.keys(params).length > 0 && (
            <Link
              href="/finance/expenses"
              className="h-8 px-3 inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      }
    >
      <FinanceTable
        columns={columns}
        rows={expenseList}
        rowKey={r => r.id}
        emptyState={
          <FinanceEmptyState
            icon={<Receipt />}
            title="No expenses logged"
            description="Use the Log Expense button to record your first vendor expense."
          />
        }
      />
    </FinancePageShell>
  );
}
