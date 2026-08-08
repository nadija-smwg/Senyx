"use client"

import Link from "next/link"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown, ChevronRight, Activity, Database, MonitorSmartphone } from "lucide-react"

export type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId: string
  timestamp: string
  actorId: string
  metadata: any
  route: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failure'
  diff?: {
    before?: any
    after?: any
  }
}

export const columns: ColumnDef<AuditLog>[] = [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
        >
          {row.getIsExpanded() ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
      ) : null
    },
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="px-0 font-semibold">
          Timestamp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="text-sm text-slate-600">{format(new Date(row.getValue("timestamp")), "MMM d, yyyy HH:mm:ss")}</div>,
  },
  {
    accessorKey: "actorId",
    header: "User ID",
    cell: ({ row }) => {
      const actorId = row.getValue("actorId") as string;
      return (
        <Link href={`/audit/timeline/${actorId}`} className="font-mono text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-colors px-2 py-1 rounded truncate max-w-[120px] inline-block">
          {actorId}
        </Link>
      )
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action") as string
      return (
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-indigo-500" />
          <span className="font-medium text-slate-700">{action}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "entityType",
    header: "Module",
    cell: ({ row }) => {
      const entityType = row.getValue("entityType") as string
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
          <Database className="w-3 h-3 mr-1 opacity-50" />
          {entityType}
        </Badge>
      )
    },
  },
  {
    accessorKey: "route",
    header: "API Route",
    cell: ({ row }) => {
      const route = row.getValue("route") as string
      return route ? <div className="font-mono text-xs text-slate-500 truncate max-w-[150px]">{route}</div> : <span className="text-slate-400 text-xs">System</span>
    },
  },
  {
    accessorKey: "userAgent",
    header: "Device",
    cell: ({ row }) => {
      const userAgent = row.getValue("userAgent") as string
      let deviceType = "Unknown"
      if (userAgent?.includes("Mobile")) deviceType = "Mobile"
      else if (userAgent?.includes("Mac OS")) deviceType = "Mac"
      else if (userAgent?.includes("Windows")) deviceType = "Windows"
      else if (userAgent?.includes("Linux")) deviceType = "Linux"

      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MonitorSmartphone className="w-3 h-3 text-slate-400" />
          {deviceType}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant="outline" className={status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}>
          {status.toUpperCase()}
        </Badge>
      )
    },
  },
]
