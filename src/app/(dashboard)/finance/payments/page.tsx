export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { payments, invoices, expenses } from '@/server/db/schema/finance';
import { eq, isNull, desc } from 'drizzle-orm';
import { PaymentFormModal } from '@/components/finance/payment-form-modal';
import Link from 'next/link';

export default async function PaymentsPage() {
  const paymentList = await db.select({
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
  })
  .from(payments)
  .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
  .leftJoin(expenses, eq(payments.expenseId, expenses.id))
  .where(isNull(payments.deletedAt))
  .orderBy(desc(payments.paidAt));

  const formatCurrency = (val: string | null, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency })
      .format(parseFloat(val || '0'));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-primary">Payments Ledger</h1>
        <PaymentFormModal />
      </div>

      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Related To</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paymentList.map((pay) => (
                <tr key={pay.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {pay.invoiceId ? (
                      <Link href={`/finance/invoices/${pay.invoiceId}`} className="text-primary hover:underline">
                        Invoice {pay.invoiceNumber}
                      </Link>
                    ) : pay.expenseId ? (
                      <span className="text-muted-foreground">Expense ({pay.expenseVendor})</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 uppercase text-xs">{pay.method?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pay.reference || '-'}</td>
                  <td className="px-4 py-3 font-bold">
                    {pay.invoiceId ? (
                      <span className="text-green-600">+{formatCurrency(pay.amount, pay.currency)}</span>
                    ) : (
                      <span className="text-red-600">-{formatCurrency(pay.amount, pay.currency)}</span>
                    )}
                  </td>
                </tr>
              ))}
              {paymentList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No payment records found.
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
