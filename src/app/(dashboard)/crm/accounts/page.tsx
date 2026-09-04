import { listAccounts } from '@/server/services/crm.service';
import { AccountsClient } from './accounts-client';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const accountsData = await listAccounts();
  return <AccountsClient initialAccounts={accountsData as any[]} />;
}
