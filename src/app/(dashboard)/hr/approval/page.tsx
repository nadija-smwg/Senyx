"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

type LeaveRequest = {
  id: string
  leaveTypeName?: string
  startDate: string
  endDate: string
  days: string
  status: string
  employeeName?: string
  employeeCode?: string
  departmentName?: string
  reason?: string
  createdAt: string
}

export default function ApprovalPage() {
  const { roles, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const [data, setData] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !roles.includes('Admin') && !roles.includes('HR Manager')) {
      router.replace('/')
    }
  }, [authLoading, roles, router])

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
    if (!authLoading && (roles.includes('Admin') || roles.includes('HR Manager'))) {
      fetchLeave()
    }
  }, [authLoading, roles])

  const handleDecision = async (id: string, decision: "approved" | "rejected", comment?: string) => {
    try {
      const res = await fetch(`/api/leave-requests/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment })
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
    { accessorKey: "employeeCode", header: "Code", cell: ({row}) => row.original.employeeCode || "—" },
    { accessorKey: "employeeName", header: "Employee", cell: ({row}) => row.original.employeeName || "Unknown" },
    { accessorKey: "departmentName", header: "Department", cell: ({row}) => row.original.departmentName || "—" },
    { accessorKey: "leaveTypeName", header: "Type", cell: ({row}) => row.original.leaveTypeName || "Unknown" },
    { accessorKey: "startDate", header: "Start Date", cell: ({row}) => new Date(row.original.startDate).toLocaleDateString() },
    { accessorKey: "endDate", header: "End Date", cell: ({row}) => new Date(row.original.endDate).toLocaleDateString() },
    { accessorKey: "days", header: "Days" },
    { accessorKey: "createdAt", header: "Submitted On", cell: ({row}) => new Date(row.original.createdAt).toLocaleDateString() },
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
      cell: ({ row }) => <ActionCell req={row.original} onDecision={handleDecision} />
    }
  ]

  if (authLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <PageHeader 
        pretitle="HR & People"
        title="Leave Approvals"
        description="Review and manage employee leave requests."
      />
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <DataTable columns={columns} data={data} searchKey="employeeName" isLoading={loading} searchPlaceholder="Search by employee name..." dateFilterColumn="startDate" />
      </div>
    </div>
  )
}

function ActionCell({ req, onDecision }: { req: LeaveRequest, onDecision: (id: string, decision: "approved" | "rejected", comment?: string) => void }) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [decisionType, setDecisionType] = useState<"approved" | "rejected" | null>(null)

  if (req.status !== "pending") return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex space-x-2">
        <Button size="sm" onClick={() => { setDecisionType("approved"); setOpen(true) }}>Approve</Button>
        <Button size="sm" variant="destructive" onClick={() => { setDecisionType("rejected"); setOpen(true) }}>Reject</Button>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{decisionType === 'approved' ? 'Approve' : 'Reject'} Leave Request</DialogTitle>
          <DialogDescription>Add an optional comment for this decision.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Comment (Optional)</Label>
            <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Enter your remarks here..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              variant={decisionType === 'rejected' ? 'destructive' : 'default'}
              onClick={() => {
                if (decisionType) onDecision(req.id, decisionType, comment)
                setOpen(false)
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
