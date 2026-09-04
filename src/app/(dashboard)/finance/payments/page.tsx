export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { payments, invoices, expenses } from '@/server/db/schema/finance';
import { accounts } from '@/server/db/schema/crm';
import { eq, isNull, desc, and, gte, lte } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  FinancePageShell,
  FinanceStatCard,
  FinanceTable,
  FinanceAmount,
  FinanceEmptyState,
  PaymentMethodBadge,
  FinanceFilterBar,
  formatFinanceDate,
  type FinanceTableColumn,
} from '@/components/finance/finance-shell';
import { PaymentFormModal } from '@/components/finance/payment-form-modal';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  ListChecks,
  Plus,
  Wallet,
} from 'lucide-react';

type PaymentRow = {
  id: string;
  amount: string | null;
  currency: string;
  method: string | null;
  paidAt: string | null;
  reference: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  expenseId: string | null;
  expenseVendor: string | null;
  accountName: string | null;
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const typeFilter = params.type as string | undefined; // 'invoice' | 'expense' | undefined
  const methodFilter = params.method as string | undefined;
  const startDate = params.startDate as string | undefined;
  const endDate = params.endDate as string | undefined;

  const conditions = [isNull(payments.deletedAt)];
  if (methodFilter) conditions.push(eq(payments.method, methodFilter));
  if (startDate) conditions.push(gte(payments.paidAt, new Date(startDate)));
  if (endDate) conditions.push(lte(payments.paidAt, new Date(endDate)));
  if (typeFilter === 'invoice') conditions.push(isNull(payments.expenseId));
  if (typeFilter === 'expense') conditions.push(isNull(payments.invoiceId));

  const paymentList = (await db.select({
    id: payments.id,
    amount: payments.amount,
    currency: payments.currency,
    method: payments.method,
    paidAt: payments.paidAt,
    reference: payments.reference,
    invoiceId: payments.invoiceId,
    invoiceNumber: invoices.invoiceNumber,
    expenseId: payments.expenseId,
    expenseVendor: expenses.vendor,
    accountName: accounts.name,
  })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(expenses, eq(payments.expenseId, expenses.id))
    .leftJoin(accounts, eq(invoices.accountId, accounts.id))
    .where(and(...conditions))
    .orderBy(desc(payments.paidAt))) as unknown as PaymentRow[];

  // Aggregates (preserving the same accounting logic as before — no changes)
  let inflowTotal = 0;
  let outflowTotal = 0;
  let countIn = 0;
  let countOut = 0;
  paymentList.forEach(p => {
    const v = parseFloat(p.amount || '0');
    if (p.invoiceId) {
      inflowTotal += v;
      countIn += 1;
    } else {
      outflowTotal += v;
      countOut += 1;
    }
  });
  const netFlow = inflowTotal - outflowTotal;

  const columns: FinanceTableColumn<PaymentRow>[] = [
    {
      id: 'paidAt',
      header: 'Date',
      width: 'w-[120px]',
      cell: (p: PaymentRow) => (
        <span className="text-sm text-gray-700 tabular-nums">{formatFinanceDate(p.paidAt)}</span>
      ),
    },
    {
      id: 'related',
      header: 'Customer / Vendor',
      cell: (p: PaymentRow) => {
        if (p.invoiceId) {
          const name = p.accountName || p.invoiceNumber || '—';
          return (
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0 [&_svg]:w-4 [&_svg]:h-4">
                <ArrowUpCircle className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/finance/invoices/${p.invoiceId}`}
                  className="text-sm font-semibold text-gray-900 hover:text-[#C1172C] truncate block max-w-[260px]"
                >
                  {name}
                </Link>
                {p.invoiceNumber && (
                  <span className="text-[11px] text-gray-400 truncate block">Invoice {p.invoiceNumber}</span>
                )}
              </div>
            </div>
          );
        }
        const vendor = p.expenseVendor || '—';
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0 [&_svg]:w-4 [&_svg]:h-4">
              <ArrowDownCircle className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-gray-900 truncate max-w-[260px]">{vendor}</span>
          </div>
        );
      },
    },
    {
      id: 'method',
      header: 'Method',
      width: 'w-[150px]',
      cell: (p: PaymentRow) => <PaymentMethodBadge method={p.method} />,
      hideOn: 'sm',
    },
    {
      id: 'reference',
      header: 'Reference',
      cell: (p: PaymentRow) =>
        p.reference ? (
          <span className="text-xs font-mono text-gray-600 truncate max-w-[220px] block">{p.reference}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      hideOn: 'md',
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      width: 'w-[180px]',
      cell: (p: PaymentRow) =>
        p.invoiceId ? (
          <FinanceAmount amount={parseFloat(p.amount || '0')} currency={p.currency} tone="positive" />
        ) : (
          <FinanceAmount amount={parseFloat(p.amount || '0')} currency={p.currency} tone="negative" />
        ),
    },
  ];

  return (
    <FinancePageShell
      pretitle="Finance"
      title="Payments"
      description="Complete ledger of inbound customer receipts and outbound expense reimbursements."
      actions={
        <PaymentFormModal
          trigger={
            <Button className="gap-1.5 bg-[#C1172C] hover:bg-[#9B1022] text-white shadow-sm">
              <Plus className="w-4 h-4" />
              Record Payment
            </Button>
          }
        />
      }
      stats={
        <>
          <FinanceStatCard
            label="Inbound"
            value={
              <FinanceAmount
                amount={inflowTotal}
                tone="positive"
                bold={false}
                className="!text-2xl !font-bold !text-emerald-700"
              />
            }
            hint={`${countIn} receipt${countIn === 1 ? '' : 's'}`}
            tone="positive"
            icon={<ArrowUpCircle />}
          />
          <FinanceStatCard
            label="Outbound"
            value={
              <FinanceAmount
                amount={outflowTotal}
                tone="negative"
                bold={false}
                className="!text-2xl !font-bold !text-rose-700"
              />
            }
            hint={`${countOut} payment${countOut === 1 ? '' : 's'}`}
            tone="negative"
            icon={<ArrowDownCircle />}
          />
          <FinanceStatCard
            label="Net Flow"
            value={
              <FinanceAmount
                amount={netFlow}
                tone={netFlow >= 0 ? 'positive' : 'negative'}
                bold={false}
                className={`!text-2xl !font-bold ${netFlow >= 0 ? '!text-emerald-700' : '!text-rose-700'}`}
              />
            }
            hint="Inflow − Outflow"
            tone={netFlow >= 0 ? 'positive' : 'negative'}
            icon={<Wallet />}
          />
          <FinanceStatCard
            label="Transactions"
            value={<span className="text-2xl font-bold font-heading text-gray-900">{paymentList.length}</span>}
            hint="In this filter set"
            tone="neutral"
            icon={<ListChecks />}
          />
        </>
      }
      toolbar={
        <FinanceFilterBar>
          <select
            name="type"
            defaultValue={(params.type as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
          >
            <option value="">Type: All</option>
            <option value="invoice">Inbound (Invoice)</option>
            <option value="expense">Outbound (Expense)</option>
          </select>
          <select
            name="method"
            defaultValue={(params.method as string) || ''}
            className="h-8 px-2.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#C1172C] focus:ring-2 focus:ring-[#C1172C]/20"
          >
            <option value="">Method: All</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
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
              href="/finance/payments"
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
        rows={paymentList}
        rowKey={r => r.id}
        emptyState={
          <FinanceEmptyState
            icon={<CreditCard />}
            title="No payments recorded"
            description="Use the Record Payment button to log your first transaction."
          />
        }
      />
    </FinancePageShell>
  );
}
