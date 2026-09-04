"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { MoreHorizontal, Copy, Eye, Pencil, Power, PowerOff, KeyRound, Mail, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { EmployeeForm } from "@/components/hr/employee-form"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export type Employee = {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  departmentName?: string
  designationTitle?: string
  status: "active" | "on_leave" | "suspended" | "terminated"
  startDate?: string
  createdAt?: string
}

/* ── Status presentation map ─────────────────────────────────────────────── */

const statusMeta: Record<
  Employee["status"],
  { label: string; variant: "positive" | "warning" | "negative" | "neutral"; dot: string; tone: string }
> = {
  active: { label: "Active", variant: "positive", dot: "bg-emerald-500", tone: "text-emerald-700" },
  on_leave: { label: "On Leave", variant: "warning", dot: "bg-amber-500", tone: "text-amber-700" },
  suspended: { label: "Suspended", variant: "negative", dot: "bg-rose-500", tone: "text-rose-700" },
  terminated: { label: "Terminated", variant: "neutral", dot: "bg-slate-400", tone: "text-slate-700" },
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function initials(first?: string, last?: string) {
  const a = (first || "").trim()[0] || ""
  const b = (last || "").trim()[0] || ""
  return (a + b).toUpperCase() || "?"
}

function formatDate(value?: string) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}

/* ── Status Badge ────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Employee["status"] }) {
  const meta = statusMeta[status] || statusMeta.terminated
  return (
    <Badge variant={meta.variant} className="gap-1.5 px-2 py-0.5 text-[10px]">
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      <span className="font-bold tracking-wide">{meta.label.toUpperCase()}</span>
    </Badge>
  )
}

/* ── Cell Renderers ─────────────────────────────────────────────────────── */

function NameCell({ row }: { row: { original: Employee } }) {
  const e = row.original
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
        <AvatarFallback className="text-[11px] font-bold">
          {initials(e.firstName, e.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 truncate">{e.firstName} {e.lastName}</div>
        <div className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
          <Mail className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{e.email}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Columns ────────────────────────────────────────────────────────────── */

export const columns: ColumnDef<Employee>[] = [
  {
    id: "employee",
    accessorKey: "firstName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 font-bold text-[11px] uppercase tracking-wider text-slate-500 hover:bg-transparent hover:text-slate-900"
      >
        Employee
        <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => <NameCell row={row} />,
    enableHiding: false,
  },
  {
    accessorKey: "employeeCode",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee ID</span>
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">
        {row.getValue("employeeCode")}
      </span>
    ),
  },
  {
    accessorKey: "departmentName",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Department</span>
    ),
    cell: ({ row }) => {
      const v = row.getValue("departmentName") as string | undefined
      return v ? (
        <span className="text-sm font-medium text-slate-700">{v}</span>
      ) : (
        <span className="text-sm text-slate-400">—</span>
      )
    },
  },
  {
    accessorKey: "designationTitle",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Position</span>
    ),
    cell: ({ row }) => {
      const v = row.getValue("designationTitle") as string | undefined
      return v ? (
        <span className="text-sm text-slate-700">{v}</span>
      ) : (
        <span className="text-sm text-slate-400">—</span>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</span>
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status") as Employee["status"]} />,
  },
  {
    accessorKey: "startDate",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Joining Date</span>
    ),
    cell: ({ row }) => {
      const raw = (row.original.startDate || row.original.createdAt) as string | undefined
      const formatted = formatDate(raw)
      if (formatted === "—") return <span className="text-sm text-slate-400">—</span>
      return <span className="text-sm text-slate-600 tabular-nums">{formatted}</span>
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => (
      <EmployeeActions
        employee={row.original}
        onRefresh={(table.options.meta as any)?.onRefresh}
      />
    ),
    enableHiding: false,
  },
]

/* ── Action Menu ────────────────────────────────────────────────────────── */

interface EmployeeActionsProps {
  employee: Employee
  onRefresh?: () => void
}

function EmployeeActions({ employee, onRefresh }: EmployeeActionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleActivate = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}/activate`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to activate employee")
      toast.success(data.message || "Employee activated successfully. Login access restored.")
      onRefresh?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeactivate = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}/deactivate`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to deactivate employee")
      toast.success(data.message || "Employee deactivated. Login access has been revoked.")
      onRefresh?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetPassword = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}/reset-password`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to send password reset")

      if (data.resetLink) {
        toast.success("Password reset link generated (dev mode). Copy from console.", { duration: 8000 })
        console.info("[DEV] Password reset link for", employee.email, ":", data.resetLink)
      } else {
        toast.success(data.message || "Password reset email sent to employee.")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(employee.employeeCode)
    toast.success("Employee code copied")
  }

  const isActive = employee.status === "active"
  const isTerminated = employee.status === "terminated"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Open actions menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Actions
        </DropdownMenuLabel>

        <DropdownMenuItem onSelect={handleCopyCode} className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2 text-slate-500" />
          Copy Employee Code
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* View / Edit Sheet */}
        <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setIsEditing(false); }}>
          <SheetTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              <Eye className="h-4 w-4 mr-2 text-slate-500" />
              View Details
            </DropdownMenuItem>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[480px] flex flex-col p-0">
            {isEditing ? (
              <>
                <SheetHeader className="px-6 py-6 border-b shrink-0">
                  <SheetTitle className="text-2xl font-bold font-heading">Edit Employee</SheetTitle>
                  <SheetDescription>Update information for {employee.firstName} {employee.lastName}</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-2 relative h-full">
                  <EmployeeForm
                    initialData={{
                      id: employee.id,
                      firstName: employee.firstName,
                      lastName: employee.lastName,
                      email: employee.email,
                      employmentType: "full_time",
                      startDate: employee.startDate || new Date().toISOString().split("T")[0],
                      designationId: "",
                    } as any}
                    onCancel={() => setIsEditing(false)}
                    onSuccess={() => { setIsEditing(false); setIsOpen(false); onRefresh?.() }}
                  />
                </div>
              </>
            ) : (
              <>
                <SheetHeader className="px-6 py-6 border-b shrink-0">
                  <SheetTitle className="text-2xl font-bold font-heading">{employee.firstName} {employee.lastName}</SheetTitle>
                  <SheetDescription>Employee details and records</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="text-base font-bold">
                        {initials(employee.firstName, employee.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-slate-500">{employee.employeeCode}</p>
                      <p className="text-sm text-slate-700 truncate">{employee.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{employee.departmentName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Position</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{employee.designationTitle || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                    <div className="mt-1.5">
                      <StatusBadge status={employee.status} />
                    </div>
                  </div>

                  {employee.startDate && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Joining Date</p>
                      <p className="mt-1 text-sm font-medium text-slate-800 tabular-nums">{formatDate(employee.startDate)}</p>
                    </div>
                  )}
                </div>
                <SheetFooter className="absolute bottom-0 w-full left-0 p-6 border-t border-slate-100 bg-slate-50/50 gap-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/hr/employees/${employee.id}`}>Full Profile</Link>
                  </Button>
                  <Button className="w-full" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit Employee
                  </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>

        <DropdownMenuSeparator />

        {/* Activate / Deactivate */}
        {isActive ? (
          <DropdownMenuItem
            className="cursor-pointer text-amber-700 focus:text-amber-800 focus:bg-amber-50"
            onSelect={(e) => { e.preventDefault(); handleDeactivate() }}
            disabled={isProcessing}
          >
            <PowerOff className="h-4 w-4 mr-2" />
            {isProcessing ? "Processing..." : "Deactivate Employee"}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="cursor-pointer text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50"
            onSelect={(e) => { e.preventDefault(); handleActivate() }}
            disabled={isProcessing || isTerminated}
          >
            <Power className="h-4 w-4 mr-2" />
            {isProcessing ? "Processing..." : "Activate Employee"}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="cursor-pointer text-blue-700 focus:text-blue-800 focus:bg-blue-50"
          onSelect={(e) => { e.preventDefault(); handleResetPassword() }}
          disabled={isProcessing}
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Reset Password
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
