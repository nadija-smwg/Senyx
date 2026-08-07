import { db } from '../db/client';
import { invoices } from '../db/schema/finance';
import { sql } from 'drizzle-orm';

export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  return await db.transaction(async (tx) => {
    // Find the max invoice number for the current year
    const [result] = await tx
      .select({ maxInvoice: sql<string>`MAX(${invoices.invoiceNumber})` })
      .from(invoices)
      .where(sql`${invoices.invoiceNumber} LIKE ${prefix || ''} || '%'`);

    let nextNumber = 1;

    if (result && result.maxInvoice) {
      // Extract the sequence number
      const parts = result.maxInvoice.split('-');
      if (parts.length === 3) {
        const sequence = parseInt(parts[2]!, 10);
        if (!isNaN(sequence)) {
          nextNumber = sequence + 1;
        }
      }
    }

    // Pad with zeros, e.g., 0001
    const paddedNumber = String(nextNumber).padStart(4, '0');
    return `${prefix}${paddedNumber}`;
  });
}
