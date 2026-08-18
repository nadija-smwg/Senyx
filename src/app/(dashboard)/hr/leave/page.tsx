"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/data/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { LeaveRequestModal } from "@/components/hr/leave-request-modal"

type LeaveRequest = {
  id: string
  leaveTypeName?: string
  startDate: string
  endDate: string
  days: string
  status: string
  employeeName?: string
}

export default function LeavePage() {
  const [data, setData] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/leave-requests")
      const json = await res.json()
      setData(json.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeave()
  }, [])



  const columns: ColumnDef<LeaveRequest>[] = [
    { accessorKey: "employeeName", header: "Employee", cell: ({row}) => row.original.employeeName || "Unknown" },
    { accessorKey: "leaveTypeName", header: "Type", cell: ({row}) => row.original.leaveTypeName || "Unknown" },
    { accessorKey: "startDate", header: "Start Date", cell: ({row}) => new Date(row.original.startDate).toLocaleDateString() },
    { accessorKey: "endDate", header: "End Date", cell: ({row}) => new Date(row.original.endDate).toLocaleDateString() },
    { accessorKey: "days", header: "Days" },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        let variant: "positive" | "negative" | "warning" | "default" = "default"
        if (status === "approved") variant = "positive"
        else if (status === "rejected") variant = "negative"
        else if (status === "pending") variant = "warning"
        return <Badge variant={variant} className="font-semibold tracking-wide uppercase">{status.toUpperCase()}</Badge>
      }
    }
  ]

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground">View and manage your time off.</p>
        </div>
        <LeaveRequestModal onSuccess={fetchLeave} />
      </div>
      <DataTable columns={columns} data={data} searchKey="employeeName" isLoading={loading} searchPlaceholder="Search by employee name..." />
    </div>
  )
}
