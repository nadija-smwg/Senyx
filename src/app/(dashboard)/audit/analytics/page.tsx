"use client"

import { useEffect, useState } from "react"
import { BarChartWidget } from "@/components/charts/bar-chart-widget"
import { PieChartWidget } from "@/components/charts/pie-chart-widget"
import { LineChartWidget } from "@/components/charts/line-chart-widget"
import { FilterBuilder, FilterGroup } from "@/components/data/filter-builder"

export default function ActivityAnalyticsPage() {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: 'AND',
    rules: []
  });
  const actionsPerUser = [
    { name: 'Admin', value: 450 },
    { name: 'John Doe', value: 320 },
    { name: 'Jane Smith', value: 210 },
    { name: 'Mark Lee', value: 150 },
    { name: 'Sarah Connor', value: 90 },
  ]

  const actionsPerModule = [
    { name: 'Sales', value: 400, color: '#10b981' },
    { name: 'Projects', value: 300, color: '#3b82f6' },
    { name: 'Finance', value: 200, color: '#f59e0b' },
    { name: 'HR', value: 150, color: '#8b5cf6' },
    { name: 'Settings', value: 50, color: '#64748b' },
  ]

  const actionsOverTime = [
    { name: 'Mon', value: 50 },
    { name: 'Tue', value: 80 },
    { name: 'Wed', value: 210 },
    { name: 'Thu', value: 150 },
    { name: 'Fri', value: 300 },
    { name: 'Sat', value: 40 },
    { name: 'Sun', value: 20 },
  ]

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Activity Analytics</h1>
          <p className="text-slate-500 mt-1">
            System-wide activity trends and top interactions.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Advanced Filters</h3>
        <FilterBuilder 
          fields={[
            { label: 'Action', value: 'action', type: 'text' },
            { label: 'Module', value: 'entityType', type: 'select', options: [
                { label: 'Users', value: 'users' }, 
                { label: 'Deals', value: 'deals' }, 
                { label: 'Projects', value: 'projects' }, 
                { label: 'Invoices', value: 'invoices' }, 
                { label: 'Settings', value: 'settings' }
              ] 
            },
            { label: 'User ID', value: 'actorId', type: 'text' },
            { label: 'Date', value: 'timestamp', type: 'date' },
          ]}
          onApply={(newGroup) => setFilterGroup(newGroup)}
          onClear={() => setFilterGroup({ logic: 'AND', rules: [] })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <LineChartWidget 
            title="Total Actions Over Time (Last 7 Days)" 
            data={actionsOverTime} 
            xAxisKey="name"
            lines={[{ key: 'value', color: '#8b5cf6', name: 'Actions' }]}
            height={300}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <BarChartWidget 
            title="Top Users by Activity" 
            data={actionsPerUser} 
            xAxisKey="name"
            bars={[{ key: 'value', color: '#10b981', name: 'Activity Count' }]}
            height={300}
          />
        </div>
          <PieChartWidget 
            title="Actions by Module" 
            data={actionsPerModule} 
            nameKey="name"
            dataKey="value"
            height={300}
          />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
        <h3 className="text-slate-700 font-heading font-bold mb-4">Top API Routes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Route</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Hit Count</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">POST /api/deals</td>
                <td className="px-4 py-3 text-slate-500">Sales</td>
                <td className="px-4 py-3 font-semibold text-slate-700 text-right">1,204</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">GET /api/projects</td>
                <td className="px-4 py-3 text-slate-500">Projects</td>
                <td className="px-4 py-3 font-semibold text-slate-700 text-right">980</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">POST /api/invoices</td>
                <td className="px-4 py-3 text-slate-500">Finance</td>
                <td className="px-4 py-3 font-semibold text-slate-700 text-right">650</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
