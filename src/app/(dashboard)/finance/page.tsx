export const dynamic = 'force-dynamic';
import { db } from '@/server/db/client';
import { invoices, expenses, subscriptions } from '@/server/db/schema/finance';
import { projects, paymentMilestones } from '@/server/db/schema/projects';
import { eq, isNull, and } from 'drizzle-orm';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import {
  FinancePageShell,
  FinanceStatCard,
  FinanceSection,
  FinanceAmount,
  FinanceEmptyState,
  AgingBar,
  ProjectReceivableCard,
  formatFinanceDate,
} from '@/components/finance/finance-shell';
import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

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

  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days90Plus: 0,
  };

  const projectReceivables: Record<string, {
    name: string;
    outstanding: number;
    milestones: Record<string, { name: string; outstanding: number }>;
  }> = {};

  const allProjects = await db.select({ id: projects.id, name: projects.name }).from(projects);
  const allMilestones = await db.select({ id: paymentMilestones.id, name: paymentMilestones.name }).from(paymentMilestones);

  allProjects.forEach(p => {
    projectReceivables[p.id] = { name: p.name, outstanding: 0, milestones: {} };
  });

  const today = new Date();
  allInvoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').forEach(inv => {
    const total = parseFloat(inv.total || '0');

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
      milestones: Object.values(p.milestones),
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
    activeProjectReceivables,
  };
}

export default async function FinanceDashboard() {
  const stats = await getFinanceDashboardStats();

  const agingBuckets = [
    { label: 'Current', amount: stats.aging.current, tone: 'positive' as const },
    { label: '1–30d', amount: stats.aging.days30, tone: 'positive' as const },
    { label: '31–60d', amount: stats.aging.days60, tone: 'warning' as const },
    { label: '61–90d', amount: stats.aging.days90, tone: 'warning' as const },
    { label: '90d+', amount: stats.aging.days90Plus, tone: 'negative' as const },
  ];

  return (
    <FinancePageShell
      pretitle="Finance"
      title="Finance Overview"
      description="Monitor revenue, expenses, receivables, and project cash flow at a glance."
      stats={
        <>
          {/* Hero: Net Profit */}
          <FinanceStatCard
            label="Net Profit"
            value={<CurrencyDisplay amount={stats.netProfit} />}
            hint={`Revenue ${formatCurrency(stats.revenue)} − Expenses ${formatCurrency(stats.totalExpenses)}`}
            tone={stats.netProfit >= 0 ? 'positive' : 'negative'}
            icon={stats.netProfit >= 0 ? <TrendingUp /> : <TrendingDown />}
            hero
          />
          <FinanceStatCard
            label="Total Revenue"
            value={<CurrencyDisplay amount={stats.revenue} />}
            hint="From paid invoices"
            tone="positive"
            icon={<TrendingUp />}
          />
          <FinanceStatCard
            label="Total Expenses"
            value={<CurrencyDisplay amount={stats.totalExpenses} />}
            hint="Approved expenses"
            tone="negative"
            icon={<TrendingDown />}
          />
          <FinanceStatCard
            label="Outstanding"
            value={<CurrencyDisplay amount={stats.outstanding} />}
            hint="Sent + overdue receivables"
            tone="warning"
            icon={<AlertTriangle />}
          />
          <FinanceStatCard
            label="Overdue"
            value={<CurrencyDisplay amount={stats.overdueTotal} />}
            hint={`${stats.overdueCount} invoice${stats.overdueCount === 1 ? '' : 's'}`}
            tone="negative"
            icon={<AlertTriangle />}
          />
          <FinanceStatCard
            label="MRR"
            value={<CurrencyDisplay amount={stats.mrr} />}
            hint="Active subscriptions"
            tone="positive"
            icon={<PiggyBank />}
          />
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aging */}
        <FinanceSection
          title="Accounts Receivable Aging"
          description="Open invoices bucketed by days past due."
          actions={
            <span className="text-xs text-gray-500">
              Total <span className="font-semibold text-gray-900 tabular-nums">{formatCurrency(stats.outstanding)}</span>
            </span>
          }
        >
          <AgingBar buckets={agingBuckets} />
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {agingBuckets.map((b) => (
              <div key={b.label} className="rounded-xl bg-gray-50/60 border border-gray-100 p-2.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={
                      'w-1.5 h-1.5 rounded-full ' +
                      (b.tone === 'negative' ? 'bg-rose-500'
                        : b.tone === 'warning' ? 'bg-amber-500'
                          : 'bg-emerald-500')
                    }
                  />
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">{b.label}</p>
                </div>
                <p className="mt-1 text-sm font-bold font-heading text-gray-900 tabular-nums truncate">
                  {formatCurrency(b.amount)}
                </p>
              </div>
            ))}
          </div>
        </FinanceSection>

        {/* Cash flow breakdown (uses the existing data, only displayed in a new way) */}
        <FinanceSection
          title="Cash Flow Snapshot"
          description="Derived from approved invoices, expenses and active subscriptions."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FlowTile
              label="Inflows (Paid)"
              amount={stats.revenue}
              tone="positive"
              icon={<Wallet />}
            />
            <FlowTile
              label="Outflows (Approved)"
              amount={stats.totalExpenses}
              tone="negative"
              icon={<Receipt />}
            />
            <FlowTile
              label="Outstanding"
              amount={stats.outstanding}
              tone="warning"
              icon={<Banknote />}
            />
            <FlowTile
              label="Recurring MRR"
              amount={stats.mrr}
              tone="info"
              icon={<CircleDollarSign />}
            />
          </div>
        </FinanceSection>

        {/* Project receivables */}
        <FinanceSection
          title="Project Receivables"
          description="Open amounts grouped by project and milestone."
          className="lg:col-span-2"
          actions={
            <span className="text-xs text-gray-500">
              {stats.activeProjectReceivables.length} project{stats.activeProjectReceivables.length === 1 ? '' : 's'}
            </span>
          }
        >
          {stats.activeProjectReceivables.length === 0 ? (
            <FinanceEmptyState
              icon={<Receipt />}
              title="No outstanding project receivables"
              description="All invoices are paid or no invoices are linked to projects yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {stats.activeProjectReceivables.map((proj, idx) => (
                <ProjectReceivableCard
                  key={idx}
                  name={proj.name}
                  amount={proj.outstanding}
                  milestones={proj.milestones.map(m => ({ name: m.name, amount: m.outstanding }))}
                />
              ))}
            </div>
          )}
        </FinanceSection>
      </div>
    </FinancePageShell>
  );
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function FlowTile({
  label,
  amount,
  tone,
  icon,
}: {
  label: string;
  amount: number;
  tone: 'positive' | 'negative' | 'warning' | 'info';
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === 'positive' ? 'text-emerald-700' :
      tone === 'negative' ? 'text-rose-700' :
        tone === 'warning' ? 'text-amber-700' :
          'text-sky-700';
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3.5 flex items-center gap-3">
      <div className={
        'w-9 h-9 rounded-xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4 ' +
        (tone === 'positive' ? 'bg-emerald-50 text-emerald-600' :
          tone === 'negative' ? 'bg-rose-50 text-rose-600' :
            tone === 'warning' ? 'bg-amber-50 text-amber-600' :
              'bg-sky-50 text-sky-600')
      }>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 truncate">{label}</p>
        <FinanceAmount amount={amount} tone={tone} className="!text-base" />
      </div>
    </div>
  );
}
