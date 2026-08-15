export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { invoices, invoiceLineItems } from '@/server/db/schema/finance';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { InvoiceEditForm } from '@/components/finance/invoice-edit-form';

export default async function InvoiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!invoice) return notFound();
  if (invoice.status !== 'draft') {
    redirect(`/finance/invoices/${id}`);
  }

  const lineItems = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-heading text-primary">Edit Invoice {invoice.invoiceNumber}</h1>
      <InvoiceEditForm 
        invoiceId={invoice.id} 
        initialData={invoice} 
        initialLineItems={lineItems} 
      />
    </div>
  );
}
