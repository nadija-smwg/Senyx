"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { KPICard } from '@/components/charts/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';

const BarChartWidget  = dynamic(() => import('@/components/charts/bar-chart-widget').then(m => m.BarChartWidget),  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> });
const PieChartWidget  = dynamic(() => import('@/components/charts/pie-chart-widget').then(m => m.PieChartWidget),  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> });
const AreaChartWidget = dynamic(() => import('@/components/charts/area-chart-widget').then(m => m.AreaChartWidget), { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-xl" /> });

import {
  Briefcase, CheckCircle, Users, DollarSign, Clock, FileText, AlertTriangle,
  TrendingUp, TrendingDown, Target, Activity, FolderKanban, Receipt, ArrowRight, Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/providers/currency-provider';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function SectionTitle({ label }: { label: string }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{label}</h2>
  );
}

import { PageHeader } from '@/components/layout/page-header';

export default function Dashboard() {
  const { user } = useAuth();
  const { format: formatCurrency } = useCurrency();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const username = user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    fetch('/api/analytics/dashboard')
      .then(r => r.json())
      .then(j => { setData(j.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-7 w-56 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className={`h-[120px] rounded-xl ${i===0 ? 'md:col-span-2':''}`} />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-gray-400 text-sm text-center py-20">Failed to load dashboard</div>;

  const fmt = (v: number) => (v || 0).toLocaleString();

  let trend: { month: string, revenue: number, expenses: number }[] = [];
  if (data?.revenueTrend || data?.expenseTrend) {
    const rev = data.revenueTrend || [], exp = data.expenseTrend || [];
    const months = Array.from(new Set([...rev.map((r: any) => r.month), ...exp.map((e: any) => e.month)])).sort() as string[];
    trend = months.map(m => ({
      month: m,
      revenue: Number(rev.find((x: any) => x.month === m)?.revenue || 0),
      expenses: Number(exp.find((x: any) => x.month === m)?.expenses || 0),
    }));
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <PageHeader 
        pretitle={greeting}
        title={username}
        description="Here's what's happening across your organization today. Monitor performance, track finances, and manage your team from the command center."
        actions={
          <>
            <Link href="/finance/invoices">
              <Button size="default" className="gap-2 shadow-lg shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold transition-all hover:scale-105"><Plus className="w-4 h-4" />New Invoice</Button>
            </Link>
            <Link href="/sales/deals">
              <Button size="default" variant="outline" className="gap-2 border-gray-200 hover:border-[#7F4D9F]/50 hover:bg-[#7F4D9F]/5 hover:text-[#7F4D9F] transition-all hover:shadow-md bg-white">Pipeline <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </>
        }
      />

      {/* Financial KPIs */}
      {data.totalRevenue !== undefined && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '100ms' }}>
          <SectionTitle label="Financial Overview" />
          {data.totalRevenue === 0 && data.totalExpenses === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center">
              <Receipt className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">No financial data yet</h3>
              <p className="text-gray-400 text-sm mb-5">Create your first invoice to start tracking performance.</p>
              <Link href="/finance/invoices"><Button>Create Invoice</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.netProfit !== undefined && (
                <div className="lg:col-span-2">
                  <KPICard title="Net Profit" value={<CurrencyDisplay amount={data.netProfit} />} icon={<TrendingUp />} isHero status="neutral" sparklineData={[40,60,40,55,75,55,75]} />
                </div>
              )}
              {data.totalRevenue !== undefined && <KPICard title="Revenue" value={<CurrencyDisplay amount={data.totalRevenue} />} icon={<DollarSign />} status="positive" sparklineData={[120,135,125,145,160,150,175]} />}
              {data.totalExpenses !== undefined && <KPICard title="Expenses" value={<CurrencyDisplay amount={data.totalExpenses} />} icon={<TrendingDown />} status="negative" sparklineData={[80,75,85,90,85,95,100]} />}
              {data.outstandingInvoices !== undefined && <KPICard title="Outstanding" value={<CurrencyDisplay amount={data.outstandingInvoices} />} icon={<AlertTriangle />} status="warning" />}
              {data.mrr !== undefined && <KPICard title="MRR" value={<CurrencyDisplay amount={data.mrr} />} subtitle={`ARR: ${formatCurrency(data.arr)}`} icon={<Activity />} status="positive" />}
            </div>
          )}
        </div>
      )}

      {/* Sales KPIs */}
      {(data.pipelineValue !== undefined || data.winRate !== undefined) && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '200ms' }}>
          <SectionTitle label="Sales & CRM" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.pipelineValue !== undefined && <KPICard title="Pipeline" value={<CurrencyDisplay amount={data.pipelineValue} />} icon={<Target />} status="neutral" />}
            {data.winRate !== undefined && <KPICard title="Win Rate" value={`${data.winRate.toFixed(1)}%`} icon={<Briefcase />} status="positive" />}
            {data.averageDealSize !== undefined && <KPICard title="Avg Deal Size" value={<CurrencyDisplay amount={data.averageDealSize} />} icon={<Briefcase />} status="neutral" />}
            {data.myDeals && <KPICard title="My Deals" value={<CurrencyDisplay amount={data.myDeals.value} />} subtitle={`${data.myDeals.count} open`} icon={<Briefcase />} status="neutral" />}
          </div>
        </div>
      )}

      {/* Operations KPIs */}
      {(data.activeProjects !== undefined || data.headcount !== undefined) && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '300ms' }}>
          <SectionTitle label="Operations & HR" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.activeProjects !== undefined && <KPICard title="Active Projects" value={fmt(data.activeProjects)} icon={<FolderKanban />} status="neutral" />}
            {data.headcount !== undefined && <KPICard title="Headcount" value={fmt(data.headcount)} icon={<Users />} status="neutral" />}
            {data.pendingLeaves !== undefined && <KPICard title="Pending Leaves" value={fmt(data.pendingLeaves)} icon={<FileText />} status="warning" />}
            {data.myTasks && <KPICard title="My Tasks" value={fmt(data.myTasks.assigned)} subtitle={`${data.myTasks.overdue} overdue`} trend={data.myTasks.overdue > 0 ? -Math.round((data.myTasks.overdue/data.myTasks.assigned)*100) : undefined} icon={<CheckCircle />} status={data.myTasks.overdue > 0 ? 'negative' : 'positive'} />}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '400ms' }}>
        {trend.length > 0 && (
          <div className="lg:col-span-2">
            <AreaChartWidget title="Revenue vs. Expenses Trend" data={trend} xAxisKey="month"
              areas={[{ key: 'revenue', color: '#1A6DB6', name: 'Revenue' }, { key: 'expenses', color: '#C1172C', name: 'Expenses' }]} />
          </div>
        )}
        {data.forecast && <BarChartWidget title="Revenue Forecast" data={data.forecast} xAxisKey="month" bars={[{ key: 'expectedRevenue', color: '#22BFE8', name: 'Expected' }]} />}
        {data.invoiceStatusBreakdown && <PieChartWidget title="Invoice Status" data={data.invoiceStatusBreakdown} nameKey="status" dataKey="value" innerRadius={50} />}
        {data.headcountByDept && <BarChartWidget title="Headcount by Department" data={data.headcountByDept} xAxisKey="dept" bars={[{ key: 'count', color: '#7F4D9F', name: 'Employees' }]} />}
        {data.pipelineSummary && <PieChartWidget title="Pipeline Summary" data={data.pipelineSummary} nameKey="stage" dataKey="value" />}
        {data.funnel && <BarChartWidget title="Sales Funnel" data={data.funnel} xAxisKey="stage" bars={[{ key: 'value', color: '#F15A22', name: 'Value' }]} />}
      </div>

      {/* Activity Feed */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '500ms' }}>
        <SectionTitle label="Recent Activity" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {[
            { initials: 'JS', color: '#1A6DB6', bg: '#E9F5FA', title: 'John Smith closed a deal', sub: 'Acme Corp Enterprise License', badge: { label: 'WON', variant: 'positive' as const }, time: '2h ago' },
            { initials: 'IN', color: '#F15A22', bg: '#FEF0EB', title: 'Invoice Sent', sub: 'INV-2026-0089', badge: { label: 'SENT', variant: 'warning' as const }, time: '5h ago' },
            { initials: 'SJ', color: '#7F4D9F', bg: '#F2E8FA', title: 'New Employee Onboarded', sub: 'Sarah Jenkins — Engineering', badge: null, time: '1d ago' },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50/70 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{item.sub}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {item.badge && <Badge variant={item.badge.variant}>{item.badge.label}</Badge>}
                <span className="text-xs text-gray-400 font-mono">{item.time}</span>
              </div>
            </div>
          ))}
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30">
            <Link href="/audit" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              View all activity <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
