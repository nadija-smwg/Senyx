"use client";

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/charts/kpi-card';
import { BarChartWidget } from '@/components/charts/bar-chart-widget';
import { PieChartWidget } from '@/components/charts/pie-chart-widget';
import { Briefcase, CheckCircle, Users, DollarSign, Clock, FileText, AlertTriangle, TrendingUp, Target, CreditCard, Activity, FolderKanban } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/dashboard')
      .then(res => res.json())
      .then(json => {
        setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) return <div>Failed to load dashboard</div>;

  const formatCurrency = (val: number) => `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNumber = (val: number) => (val || 0).toLocaleString();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
      </div>

      {/* ADMIN & FINANCE KPIS */}
      {(data.totalRevenue !== undefined || data.accountsPayable !== undefined) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.totalRevenue !== undefined && (
              <KPICard title="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={<DollarSign />} />
            )}
            {data.totalExpenses !== undefined && (
              <KPICard title="Total Expenses" value={formatCurrency(data.totalExpenses)} icon={<CreditCard />} />
            )}
            {data.netProfit !== undefined && (
              <KPICard title="Net Profit" value={formatCurrency(data.netProfit)} icon={<TrendingUp />} />
            )}
            {data.mrr !== undefined && (
              <KPICard title="MRR" value={formatCurrency(data.mrr)} subtitle={`ARR: ${formatCurrency(data.arr)}`} icon={<Activity />} />
            )}
            {data.outstandingInvoices !== undefined && (
              <KPICard title="Outstanding Invoices" value={formatCurrency(data.outstandingInvoices)} icon={<AlertTriangle />} />
            )}
            {data.accountsPayable !== undefined && (
              <KPICard title="Accounts Payable" value={formatCurrency(data.accountsPayable)} icon={<AlertTriangle />} />
            )}
          </div>
        </div>
      )}

      {/* SALES & CRM KPIS */}
      {(data.pipelineValue !== undefined || data.myDeals !== undefined || data.winRate !== undefined) && (
        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-semibold text-slate-800">Sales & CRM</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.pipelineValue !== undefined && (
              <KPICard title="Pipeline Value" value={formatCurrency(data.pipelineValue)} icon={<Target />} />
            )}
            {data.weightedPipelineValue !== undefined && (
              <KPICard title="Weighted Pipeline" value={formatCurrency(data.weightedPipelineValue)} icon={<Target />} />
            )}
            {data.winRate !== undefined && (
              <KPICard title="Win Rate" value={`${data.winRate.toFixed(1)}%`} icon={<Briefcase />} />
            )}
            {data.averageDealSize !== undefined && (
              <KPICard title="Avg Deal Size" value={formatCurrency(data.averageDealSize)} icon={<Briefcase />} />
            )}
            {data.myDeals && (
              <KPICard title="My Deals Value" value={formatCurrency(data.myDeals.value)} subtitle={`${data.myDeals.count} open deals`} icon={<Briefcase />} />
            )}
          </div>
        </div>
      )}

      {/* OPERATIONS, PROJECTS & HR KPIS */}
      {(data.activeProjects !== undefined || data.myTasks !== undefined || data.headcount !== undefined || data.pendingLeaves !== undefined) && (
        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-semibold text-slate-800">Operations & HR</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.activeProjects !== undefined && (
              <KPICard title="Active Projects" value={formatNumber(data.activeProjects)} icon={<FolderKanban />} />
            )}
            {data.headcount !== undefined && (
              <KPICard title="Total Headcount" value={formatNumber(data.headcount)} icon={<Users />} />
            )}
            {data.pendingLeaves !== undefined && (
              <KPICard title="Pending Leaves" value={formatNumber(data.pendingLeaves)} icon={<FileText />} />
            )}
            {data.resourceUtilization !== undefined && (
              <KPICard title="Resource Utilization" value={`${data.resourceUtilization.toFixed(1)}%`} subtitle="Billable vs Non-Billable" icon={<Clock />} />
            )}
            {data.myTasks && (
              <KPICard title="Assigned Tasks" value={formatNumber(data.myTasks.assigned)} subtitle={`${data.myTasks.overdue} overdue`} trend={data.myTasks.overdue > 0 ? -Math.round((data.myTasks.overdue / data.myTasks.assigned)*100) : undefined} icon={<CheckCircle />} />
            )}
            {data.billableHours !== undefined && (
              <KPICard title="Billable Hours" value={formatNumber(data.billableHours)} subtitle={`${data.nonBillableHours} non-billable`} icon={<Clock />} />
            )}
          </div>
        </div>
      )}

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {data.revenueTrend && (
          <BarChartWidget title="Revenue Trend" data={data.revenueTrend} xAxisKey="month" bars={[{ key: 'revenue', color: '#3b82f6', name: 'Revenue' }]} />
        )}
        
        {data.expenseTrend && (
          <BarChartWidget title="Expense Trend" data={data.expenseTrend} xAxisKey="month" bars={[{ key: 'expenses', color: '#ef4444', name: 'Expenses' }]} />
        )}

        {data.forecast && (
          <BarChartWidget title="Revenue Forecast" data={data.forecast} xAxisKey="month" bars={[{ key: 'expectedRevenue', color: '#10b981', name: 'Expected Revenue' }]} />
        )}

        {data.invoiceStatusBreakdown && (
          <PieChartWidget title="Invoice Status" data={data.invoiceStatusBreakdown} nameKey="status" dataKey="value" innerRadius={60} />
        )}

        {data.headcountByDept && (
          <BarChartWidget title="Headcount by Department" data={data.headcountByDept} xAxisKey="dept" bars={[{ key: 'count', color: '#8b5cf6', name: 'Employees' }]} />
        )}

        {data.employmentTypeBreakdown && (
          <PieChartWidget title="Employment Type" data={data.employmentTypeBreakdown} nameKey="type" dataKey="count" />
        )}

        {data.pipelineSummary && (
          <PieChartWidget title="Pipeline Summary" data={data.pipelineSummary} nameKey="stage" dataKey="value" />
        )}
        
        {data.funnel && (
          <BarChartWidget title="Sales Funnel" data={data.funnel} xAxisKey="stage" bars={[{ key: 'value', color: '#f59e0b', name: 'Pipeline Value' }]} />
        )}
      </div>
    </div>
  );
}
