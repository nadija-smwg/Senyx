"use client"

import { useEffect, useState } from "react"
import { columns, AuditLog } from "./columns"
import { DataTable } from "@/components/data/data-table"
import { FilterBuilder, FilterGroup } from "@/components/data/filter-builder"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  // Example filter config for audit logs
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: 'AND',
    rules: []
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // In a real implementation we would post the filterGroup to /api/audit-logs
        const response = await fetch("/api/audit-logs")
        if (!response.ok) throw new Error("Failed to fetch audit logs")
        const result = await response.json()
        setData(result.data || [])
      } catch (error) {
        console.error("Error fetching audit logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const renderSubComponent = ({ row }: { row: any }) => {
    const diff = row.original.diff;
    if (!diff || (!diff.before && !diff.after)) return (
      <div className="p-4 text-sm text-slate-500 bg-slate-50 border-t border-slate-100 italic">No diff available.</div>
    );
    
    return (
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
          <h4 className="text-xs font-bold text-rose-600 mb-2 uppercase tracking-wider">Before</h4>
          <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-60 scrollbar-hide">
            {diff.before ? JSON.stringify(diff.before, null, 2) : 'null'}
          </pre>
        </div>
        <div className="flex-1 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
          <h4 className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wider">After</h4>
          <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-60 scrollbar-hide">
            {diff.after ? JSON.stringify(diff.after, null, 2) : 'null'}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1">
            System-wide activity and security log.
          </p>
        </div>
        <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
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
            { label: 'Status', value: 'status', type: 'select', options: [
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

      <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
        <DataTable
          columns={columns}
          data={data}
          searchKey="action"
          searchPlaceholder="Search by action..."
          isLoading={loading}
          renderSubComponent={renderSubComponent}
        />
      </div>
    </div>
  )
}
