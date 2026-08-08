import { db } from '@/server/db/client';
import { invoices, invoiceLineItems, payments } from '@/server/db/schema/finance';
import { accounts } from '@/server/db/schema/crm';
import { eq, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InvoiceActions } from '@/components/finance/invoice-actions';

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

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;

  const [invoice] = await db.select({
    id: invoices.id,
    invoiceNumber: invoices.invoiceNumber,
    status: invoices.status,
    total: invoices.total,
    subtotal: invoices.subtotal,
    tax: invoices.tax,
    currency: invoices.currency,
    dueDate: invoices.dueDate,
    issueDate: invoices.issueDate,
    createdAt: invoices.createdAt,
    accountName: accounts.name
  })
  .from(invoices)
  .leftJoin(accounts, eq(invoices.accountId, accounts.id))
  .where(eq(invoices.id, id));

  if (!invoice) return notFound();

  const lineItems = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));
  
  const paymentRecords = await db.select().from(payments)
    .where(eq(payments.invoiceId, id));

  const formatCurrency = (val: string | null, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency })
      .format(parseFloat(val || '0'));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header Actions (hidden when printing) */}
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-heading font-bold text-primary">Invoice {invoice.invoiceNumber}</h1>
        <div className="flex gap-3">
          <InvoiceActions invoiceId={invoice.id} status={invoice.status || 'draft'} />
        </div>
      </div>

      {/* Printable Invoice Document */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-lg shadow-sm border print:shadow-none print:border-none">
        
        <div className="flex justify-between items-start border-b pb-8">
          <div>
            <h2 className="text-4xl font-heading font-bold text-gray-900">INVOICE</h2>
            <p className="text-gray-500 mt-1">{invoice.invoiceNumber}</p>
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border print:hidden ${getStatusBadgeClass(invoice.status || 'draft')}`}>
                {invoice.status?.toUpperCase() || 'DRAFT'}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <h3 className="font-bold text-gray-900 text-lg mb-2">SENYX INC.</h3>
            <p>123 Business Avenue</p>
            <p>Tech District, NY 10001</p>
            <p>billing@senyx.com</p>
          </div>
        </div>

        <div className="flex justify-between items-start py-8">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-xs">Billed To</p>
            <p className="font-medium text-lg text-gray-900">{invoice.accountName || 'Unknown Client'}</p>
          </div>
          <div className="text-sm text-right grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="text-gray-500">Date Issued:</div>
            <div className="font-medium text-gray-900">
              {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-gray-500">Due Date:</div>
            <div className="font-medium text-gray-900">
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        <table className="w-full text-sm text-left mb-8">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-y">
            <tr>
              <th className="px-4 py-3 w-3/5">Description</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4 text-gray-900">{item.description}</td>
                <td className="px-4 py-4 text-right text-gray-600">{item.quantity}</td>
                <td className="px-4 py-4 text-right text-gray-600">{formatCurrency(item.unitPrice, invoice.currency || undefined)}</td>
                <td className="px-4 py-4 text-right text-gray-900 font-medium">{formatCurrency(item.amount, invoice.currency || undefined)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t pt-8">
          <div className="w-64 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency || undefined)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax:</span>
              <span>{formatCurrency(invoice.tax, invoice.currency || undefined)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3 mt-3">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total, invoice.currency || undefined)}</span>
            </div>
          </div>
        </div>
        
      </div>

      {/* Payment History (hidden when printing) */}
      {paymentRecords.length > 0 && (
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border print:hidden mt-8">
          <h2 className="text-xl font-heading font-semibold mb-4">Payment History</h2>
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paymentRecords.map((payment) => (
                <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 uppercase text-xs">{payment.method?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{payment.reference || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(payment.amount, payment.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
