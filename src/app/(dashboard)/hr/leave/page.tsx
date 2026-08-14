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

  const fetchLeave = () => {
    Promise.resolve().then(() => setLoading(true))
    fetch("/api/leave-requests")
      .then(res => res.json())
      .then(json => setData(json.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLeave()
  }, [])

  const handleDecision = async (id: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/leave-requests/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Failed to submit decision")
      }
      toast.success(`Leave request ${decision}`)
      fetchLeave()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

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
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const req = row.original
        if (req.status !== "pending") return null
        return (
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => handleDecision(req.id, "approved")}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => handleDecision(req.id, "rejected")}>Reject</Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground">Manage employee time off.</p>
        </div>
        <LeaveRequestModal onSuccess={fetchLeave} />
      </div>
      <DataTable columns={columns} data={data} searchKey="employeeName" isLoading={loading} searchPlaceholder="Search by employee name..." />
    </div>
  )
}
