export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { expenses } from '@/server/db/schema/finance';
import { projects } from '@/server/db/schema/projects';
import { eq, isNull, desc, and, gte, lte } from 'drizzle-orm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ExpenseForm } from '@/components/finance/expense-form';
import { Button } from '@/components/ui/button';
import { ExpenseActions } from '@/components/finance/expense-actions';
import { ExpenseDocumentsModal } from '@/components/finance/expense-documents-modal';

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'reimbursed': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

import Link from 'next/link';

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

  const expenseList = await db.select({
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
  .orderBy(desc(expenses.expenseDate));

  const formatCurrency = (val: string | null, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency })
      .format(parseFloat(val || '0'));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-primary">Expenses</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Log Expense</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[480px] overflow-hidden flex flex-col p-0">
            <SheetHeader className="px-6 py-6 border-b shrink-0">
              <SheetTitle className="text-2xl font-bold font-heading">Log New Expense</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 relative h-full">
              <ExpenseForm />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
        <form method="GET" className="flex flex-wrap gap-3 mb-4 items-center print:hidden">
          <select name="status" defaultValue={(params.status as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground">
            <option value="">Status: All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="reimbursed">Reimbursed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select name="category" defaultValue={(params.category as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground">
            <option value="">Category: All</option>
            <option value="Travel">Travel</option>
            <option value="Meals">Meals</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Software">Software</option>
            <option value="Other">Other</option>
          </select>
          <select name="projectId" defaultValue={(params.projectId as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground">
            <option value="">Project: All</option>
            {projectList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input type="date" name="startDate" defaultValue={(params.startDate as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground" title="Start Date" />
          <input type="date" name="endDate" defaultValue={(params.endDate as string) || ''} className="p-2 text-sm border rounded-md bg-background text-muted-foreground" title="End Date" />
          
          <button type="submit" className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80">Filter</button>
          {Object.keys(params).length > 0 && (
            <Link href="/finance/expenses" className="text-sm text-muted-foreground hover:underline">Clear</Link>
          )}
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenseList.map((exp) => (
                <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    {new Date(exp.expenseDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{exp.vendor}</td>
                  <td className="px-4 py-3">{exp.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{exp.projectName || '-'}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(exp.amount, exp.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(exp.approvalStatus || 'pending')}`}>
                      {exp.approvalStatus?.toUpperCase() || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <ExpenseDocumentsModal expenseId={exp.id} />
                      <ExpenseActions expenseId={exp.id} status={exp.approvalStatus || 'pending'} />
                    </div>
                  </td>
                </tr>
              ))}
              {expenseList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No expenses logged.
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
