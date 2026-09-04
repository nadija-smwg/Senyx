"use client"

import { useEffect, useMemo, useState } from "react"
import { columns, AuditLog } from "./columns"
import { DataTable } from "@/components/data/data-table"
import { FilterBuilder, FilterGroup } from "@/components/data/filter-builder"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  History,
  Loader2,
  Search,
  Shield,
  User as UserIcon,
} from "lucide-react"
import { SettingsStatPill } from "@/components/settings/settings-shell"

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  // Example filter config for audit logs
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: 'AND',
    rules: []
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/audit-logs", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filterGroup })
        })
        if (!response.ok) throw new Error("Failed to fetch audit logs")
        const result = await response.json()
        setData(result.data || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load audit logs")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filterGroup])

  const renderSubComponent = ({ row }: { row: any }) => {
    const before = row.original.before;
    const after = row.original.after;
    if (!before && !after) return (
      <div className="px-6 py-4 text-sm text-gray-500 bg-gray-50/40 border-t border-gray-100 italic">No diff available.</div>
    );

    return (
      <div className="px-6 py-4 bg-gray-50/40 border-t border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-rose-600 mb-2 uppercase tracking-[0.14em]">Before</h4>
          <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-60 scrollbar-hide">
            {before ? JSON.stringify(before, null, 2) : 'null'}
          </pre>
        </div>
        <div className="flex-1 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-emerald-600 mb-2 uppercase tracking-[0.14em]">After</h4>
          <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-60 scrollbar-hide">
            {after ? JSON.stringify(after, null, 2) : 'null'}
          </pre>
        </div>
      </div>
    )
  }

  // Live KPI strip derived from current data set
  const stats = useMemo(() => {
    const total = data.length;
    const success = data.filter(d => d.result === 'success').length;
    const failure = data.filter(d => d.result === 'failure').length;
    const uniqueUsers = new Set(data.map(d => d.actorId).filter(Boolean)).size;
    return { total, success, failure, uniqueUsers };
  }, [data]);

  const handleExport = () => {
    try {
      const csv = [
        ['Timestamp', 'Action', 'Module', 'Actor', 'API Route', 'Status', 'Device'].join(','),
        ...data.map(d => [
          d.createdAt,
          d.action,
          d.entityType,
          d.actorId,
          d.apiRoute || 'System',
          d.result,
          [d.device, d.os, d.browser].filter(Boolean).join(' / '),
        ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[180%] rounded-[100%] bg-gradient-to-br from-[#22BFE8]/12 via-[#1A6DB6]/8 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60%] left-[-10%] w-[40%] h-[180%] rounded-[100%] bg-gradient-to-tr from-[#F15A22]/10 via-[#EC4C49]/8 to-transparent blur-3xl pointer-events-none" />
        <div className="relative px-5 sm:px-7 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#1A6DB6] via-[#22BFE8] to-[#7F4D9F] bg-clip-text text-transparent">
              Security
            </p>
            <h1 className="mt-1 text-2xl font-extrabold font-heading text-gray-900 tracking-tight truncate">
              Audit Logs
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
              System-wide activity and security log. Every API mutation is recorded immutably.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Quick filter…"
                className="h-9 pl-8 pr-3 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1A6DB6] focus:ring-2 focus:ring-[#1A6DB6]/20 w-44 lg:w-56"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-1.5 border-gray-200 text-gray-700 hover:text-[#1A6DB6]"
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SettingsStatPill
          label="Total Events"
          value={<span className="text-2xl font-bold font-heading text-gray-900 tabular-nums">{stats.total}</span>}
          icon={<History />}
        />
        <SettingsStatPill
          label="Success"
          value={
            <span className="text-2xl font-bold font-heading text-emerald-700 tabular-nums">
              {stats.success}
            </span>
          }
          icon={<CheckCircle2 />}
        />
        <SettingsStatPill
          label="Failure"
          value={
            <span className="text-2xl font-bold font-heading text-rose-700 tabular-nums">
              {stats.failure}
            </span>
          }
          icon={<AlertTriangle />}
        />
        <SettingsStatPill
          label="Unique Users"
          value={<span className="text-2xl font-bold font-heading text-gray-900 tabular-nums">{stats.uniqueUsers}</span>}
          icon={<UserIcon />}
        />
      </div>

      {/* Filters */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-[#EAF6FB] text-[#1A6DB6] flex items-center justify-center [&_svg]:w-[18px] [&_svg]:h-[18px]">
            <Shield />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Advanced filters</h3>
            <p className="text-[11px] text-gray-500">Combine rules with AND/OR logic to narrow the result set.</p>
          </div>
        </div>
        <div className="p-4">
          <FilterBuilder
            fields={[
              { label: 'Action', value: 'action', type: 'text' },
              {
                label: 'Module', value: 'entityType', type: 'select', options: [
                  { label: 'Users', value: 'users' },
                  { label: 'Deals', value: 'deals' },
                  { label: 'Projects', value: 'projects' },
                  { label: 'Invoices', value: 'invoices' },
                  { label: 'Settings', value: 'settings' }
                ]
              },
              { label: 'User ID', value: 'actorId', type: 'text' },
              {
                label: 'Status', value: 'status', type: 'select', options: [
                  { label: 'Success', value: 'success' },
                  { label: 'Failure', value: 'failure' }
                ]
              },
              { label: 'Date', value: 'timestamp', type: 'date' },
            ]}
            onApply={(newGroup) => setFilterGroup(newGroup)}
            onClear={() => setFilterGroup({ logic: 'AND', rules: [] })}
          />
        </div>
      </section>

      {/* Table */}
      {error ? (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 text-rose-600 text-sm">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 px-6 py-12">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading audit logs…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              searchKey="action"
              searchPlaceholder="Search by action..."
              isLoading={loading}
              renderSubComponent={renderSubComponent}
            />
          )}
        </div>
      )}
    </div>
  )
}
