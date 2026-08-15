export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { invoices, expenses, subscriptions } from '@/server/db/schema/finance';
import { projects, paymentMilestones } from '@/server/db/schema/projects';
import { eq, inArray, and, isNull, sum, count } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { CurrencyDisplay } from '@/components/ui/currency-display';

// Mock function for now, in a real app these would be proper DB queries
async function getFinanceDashboardStats() {
  const allInvoices = await db.select().from(invoices).where(isNull(invoices.deletedAt));
  const allExpenses = await db.select().from(expenses).where(and(isNull(expenses.deletedAt), eq(expenses.approvalStatus, 'approved')));
  const allSubscriptions = await db.select().from(subscriptions).where(and(isNull(subscriptions.deletedAt), eq(subscriptions.status, 'active')));

  let revenue = 0;
  let outstanding = 0;
  let overdueCount = 0;
  let overdueTotal = 0;
  let mrr = 0;

  allInvoices.forEach(inv => {
    const total = parseFloat(inv.total || '0');
    if (inv.status === 'paid') revenue += total;
    if (inv.status === 'sent' || inv.status === 'overdue') outstanding += total;
    if (inv.status === 'overdue') {
      overdueCount++;
      overdueTotal += total;
    }
  });

  let totalExpenses = 0;
  allExpenses.forEach(exp => {
    totalExpenses += parseFloat(exp.amount || '0');
  });

  allSubscriptions.forEach(sub => {
    mrr += parseFloat(sub.mrr || '0');
  });

  const netProfit = revenue - totalExpenses;

  // AR Aging and Project Breakdown
  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days90Plus: 0
  };

  const projectReceivables: Record<string, { 
    name: string; 
    outstanding: number; 
    milestones: Record<string, { name: string; outstanding: number }> 
  }> = {};
  
  const allProjects = await db.select({ id: projects.id, name: projects.name }).from(projects);
  const allMilestones = await db.select({ id: paymentMilestones.id, name: paymentMilestones.name }).from(paymentMilestones);
  
  allProjects.forEach(p => {
    projectReceivables[p.id] = { name: p.name, outstanding: 0, milestones: {} };
  });

  const today = new Date();
  allInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').forEach(inv => {
    const total = parseFloat(inv.total || '0');
    
    // Project breakdown
    if (inv.projectId) {
      const proj = projectReceivables[inv.projectId];
      if (proj) {
        proj.outstanding += total;
        if (inv.paymentMilestoneId) {
          const mName = allMilestones.find(ms => ms.id === inv.paymentMilestoneId)?.name || 'Unknown Milestone';
          if (!proj.milestones[inv.paymentMilestoneId]) {
            proj.milestones[inv.paymentMilestoneId] = { name: mName, outstanding: total };
          } else {
            proj.milestones[inv.paymentMilestoneId]!.outstanding += total;
          }
        } else {
          if (!proj.milestones['unlinked']) {
            proj.milestones['unlinked'] = { name: 'Direct/Unlinked', outstanding: total };
          } else {
            proj.milestones['unlinked']!.outstanding += total;
          }
        }
      }
    }

    // Aging
    if (!inv.dueDate) {
      aging.current += total;
      return;
    }
    const due = new Date(inv.dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) aging.current += total;
    else if (diffDays <= 30) aging.days30 += total;
    else if (diffDays <= 60) aging.days60 += total;
    else if (diffDays <= 90) aging.days90 += total;
    else aging.days90Plus += total;
  });

  const activeProjectReceivables = Object.values(projectReceivables)
    .filter(p => p.outstanding > 0)
    .map(p => ({
      ...p,
      milestones: Object.values(p.milestones)
    }));

  return {
    revenue,
    totalExpenses,
    outstanding,
    overdueCount,
    overdueTotal,
    mrr,
    netProfit,
    aging,
    activeProjectReceivables
  };
}

export default async function FinanceDashboard() {
  const stats = await getFinanceDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader title="Finance Overview" description="Monitor company financial metrics and receivables." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
          <div className="text-3xl font-bold mt-2 text-green-600"><CurrencyDisplay amount={stats.revenue} /></div>
          <p className="text-xs text-muted-foreground mt-1">From Paid Invoices</p>
        </div>
        
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
          <div className="text-3xl font-bold mt-2 text-red-600"><CurrencyDisplay amount={stats.totalExpenses} /></div>
          <p className="text-xs text-muted-foreground mt-1">Approved Expenses</p>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">Net Profit</h3>
          <div className="text-3xl font-bold mt-2 text-blue-600"><CurrencyDisplay amount={stats.netProfit} /></div>
          <p className="text-xs text-muted-foreground mt-1">Revenue - Expenses</p>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">Outstanding Receivables</h3>
          <div className="text-3xl font-bold mt-2"><CurrencyDisplay amount={stats.outstanding} /></div>
          <p className="text-xs text-muted-foreground mt-1">Awaiting Payment</p>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">Overdue Invoices</h3>
          <div className="text-3xl font-bold mt-2 text-orange-600"><CurrencyDisplay amount={stats.overdueTotal} /></div>
          <p className="text-xs text-muted-foreground mt-1">{stats.overdueCount} Invoices</p>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-muted-foreground">Total MRR</h3>
          <div className="text-3xl font-bold mt-2 text-purple-600"><CurrencyDisplay amount={stats.mrr} /></div>
          <p className="text-xs text-muted-foreground mt-1">Active Subscriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-heading font-semibold mb-4 text-primary">Accounts Receivable Aging</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">1 - 30 Days</th>
                  <th className="px-4 py-3">31 - 60 Days</th>
                  <th className="px-4 py-3">61 - 90 Days</th>
                  <th className="px-4 py-3 text-destructive">90+ Days</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium"><CurrencyDisplay amount={stats.aging.current} /></td>
                  <td className="px-4 py-3"><CurrencyDisplay amount={stats.aging.days30} /></td>
                  <td className="px-4 py-3"><CurrencyDisplay amount={stats.aging.days60} /></td>
                  <td className="px-4 py-3 text-orange-600"><CurrencyDisplay amount={stats.aging.days90} /></td>
                  <td className="px-4 py-3 font-bold text-destructive"><CurrencyDisplay amount={stats.aging.days90Plus} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-heading font-semibold mb-4 text-primary">Project Receivables</h2>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {stats.activeProjectReceivables.length > 0 ? (
              stats.activeProjectReceivables.map((proj, idx) => (
                <div key={idx} className="bg-muted/50 rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm text-primary">{proj.name}</span>
                    <span className="font-bold text-sm"><CurrencyDisplay amount={proj.outstanding} /></span>
                  </div>
                  {proj.milestones.length > 0 && (
                    <div className="space-y-1 mt-2 border-t pt-2">
                      {proj.milestones.map((ms, msIdx) => (
                        <div key={msIdx} className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{ms.name}</span>
                          <span className="font-medium text-muted-foreground"><CurrencyDisplay amount={ms.outstanding} /></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No outstanding invoices linked to projects.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
