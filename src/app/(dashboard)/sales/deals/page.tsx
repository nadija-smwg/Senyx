import { db } from '@/server/db/client';
import { deals } from '@/server/db/schema/sales';
import { accounts } from '@/server/db/schema/crm';
import { isNull, desc } from 'drizzle-orm';
import { DealsClient } from './deals-client';

export const dynamic = 'force-dynamic';

export default async function DealsPage() {
  const [dealsData, accountsData] = await Promise.all([
    db.select().from(deals).where(isNull(deals.deletedAt)).orderBy(desc(deals.createdAt)),
    db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(isNull(accounts.deletedAt)),
  ]);

  return <DealsClient initialDeals={dealsData as any[]} initialAccounts={accountsData as any[]} />;
}
