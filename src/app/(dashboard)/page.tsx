"use client";

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/charts/kpi-card';
import { BarChartWidget } from '@/components/charts/bar-chart-widget';
import { PieChartWidget } from '@/components/charts/pie-chart-widget';
import { Briefcase, CheckCircle, Users, DollarSign, Clock, FileText, AlertTriangle } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return <div>Failed to load dashboard</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.myDeals && (
          <KPICard 
            title="My Deals Value" 
            value={`$${data.myDeals.value.toLocaleString()}`} 
            subtitle={`${data.myDeals.count} open deals`}
            icon={<Briefcase />}
          />
        )}
        
        {data.myTasks && (
          <KPICard 
            title="Assigned Tasks" 
            value={data.myTasks.assigned} 
            subtitle={`${data.myTasks.overdue} overdue`}
            trend={data.myTasks.overdue > 0 ? -Math.round((data.myTasks.overdue / data.myTasks.assigned)*100) : undefined}
            icon={<CheckCircle />}
          />
        )}
        
        {data.resourceUtilization !== undefined && (
          <KPICard 
            title="Resource Utilization" 
            value={`${data.resourceUtilization.toFixed(1)}%`} 
            subtitle="Billable vs Non-Billable"
            icon={<Clock />}
          />
        )}
        
        {data.accountsPayable !== undefined && (
          <KPICard 
            title="Accounts Payable" 
            value={`$${data.accountsPayable.toLocaleString()}`} 
            icon={<AlertTriangle />}
          />
        )}

        {data.headcount && (
          <KPICard 
            title="Total Headcount" 
            value={data.headcount} 
            icon={<Users />}
          />
        )}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend */}
        {data.revenueTrend && (
          <BarChartWidget 
            title="12-Month Revenue Trend"
            data={data.revenueTrend}
            xAxisKey="month"
            bars={[{ key: 'revenue', color: '#3b82f6', name: 'Revenue' }]}
          />
        )}

        {/* Invoice Status */}
        {data.invoiceStatusBreakdown && (
          <PieChartWidget 
            title="Invoice Status Breakdown"
            data={data.invoiceStatusBreakdown}
            nameKey="status"
            dataKey="value"
            innerRadius={60}
          />
        )}

        {/* Headcount by Dept */}
        {data.headcountByDept && (
          <BarChartWidget 
            title="Headcount by Department"
            data={data.headcountByDept}
            xAxisKey="department"
            bars={[{ key: 'count', color: '#10b981', name: 'Employees' }]}
          />
        )}

        {/* Pipeline Summary */}
        {data.pipelineSummary && (
          <PieChartWidget 
            title="Pipeline Summary"
            data={data.pipelineSummary}
            nameKey="stage"
            dataKey="value"
          />
        )}
        
      </div>
    </div>
  );
}
