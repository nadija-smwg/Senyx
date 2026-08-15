export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { subscriptions } from '@/server/db/schema/finance';
import { accounts } from '@/server/db/schema/crm';
import { eq, isNull, desc } from 'drizzle-orm';
import { SubscriptionFormModal } from '@/components/finance/subscription-form-modal';

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'trialing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'past_due': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export default async function SubscriptionsPage() {
  const subList = await db.select({
    id: subscriptions.id,
    productName: subscriptions.productName,
    plan: subscriptions.plan,
    amount: subscriptions.amount,
    currency: subscriptions.currency,
    interval: subscriptions.interval,
    status: subscriptions.status,
    mrr: subscriptions.mrr,
    accountName: accounts.name
  })
  .from(subscriptions)
  .leftJoin(accounts, eq(subscriptions.accountId, accounts.id))
  .where(isNull(subscriptions.deletedAt))
  .orderBy(desc(subscriptions.createdAt));

  let totalMRR = 0;
  subList.forEach(s => {
    if (s.status === 'active' || s.status === 'trialing') {
      totalMRR += parseFloat(s.mrr || '0');
    }
  });
  const totalARR = totalMRR * 12;

  const formatCurrency = (val: number | string | null, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency })
      .format(typeof val === 'string' ? parseFloat(val || '0') : (val || 0));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-primary">Recurring Revenue</h1>
        <SubscriptionFormModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-primary/20">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total MRR</h3>
          <div className="text-4xl font-bold mt-2 text-primary">{formatCurrency(totalMRR)}</div>
          <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-primary/20">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total ARR</h3>
          <div className="text-4xl font-bold mt-2 text-primary">{formatCurrency(totalARR)}</div>
          <p className="text-xs text-muted-foreground mt-1">Annual Recurring Revenue</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Product / Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Interval</th>
                <th className="px-4 py-3">MRR</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {subList.map((sub) => (
                <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{sub.accountName || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <div>{sub.productName}</div>
                    <div className="text-xs text-muted-foreground">{sub.plan}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(sub.amount, sub.currency)}</td>
                  <td className="px-4 py-3 capitalize">{sub.interval}</td>
                  <td className="px-4 py-3 font-bold text-green-600">+{formatCurrency(sub.mrr, sub.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(sub.status || 'active')}`}>
                      {sub.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
              {subList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No active subscriptions.
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
