"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
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
import Link from "next/link"
import { useState } from "react"
import { EmployeeForm } from "@/components/hr/employee-form"
import { toast } from "sonner"

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
}

export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "employeeCode",
    header: "Code",
    cell: ({ row }) => <span className="font-mono text-slate-600">{row.getValue("employeeCode")}</span>,
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const firstName = row.getValue("firstName") as string
      const lastName = row.original.lastName
      return <div className="font-medium">{firstName} {lastName}</div>
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => row.getValue("departmentName") || "N/A",
  },
  {
    accessorKey: "designationTitle",
    header: "Designation",
    cell: ({ row }) => row.getValue("designationTitle") || "N/A",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variantMap: Record<string, "positive" | "warning" | "negative" | "default"> = {
        'active': 'positive',
        'on_leave': 'warning',
        'suspended': 'negative',
        'terminated': 'default',
      }
      
      const variant = variantMap[status] || 'default';
      
      return <Badge variant={variant} className="font-semibold tracking-wide uppercase">{status.replace('_', ' ')}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <EmployeeActions
        employee={row.original}
        onRefresh={(table.options.meta as any)?.onRefresh}
      />
    ),
  },
]

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
      const res = await fetch(`/api/employees/${employee.id}/activate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to activate employee')
      toast.success(data.message || 'Employee activated successfully. Login access restored.')
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
      const res = await fetch(`/api/employees/${employee.id}/deactivate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to deactivate employee')
      toast.success(data.message || 'Employee deactivated. Login access has been revoked.')
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
      const res = await fetch(`/api/employees/${employee.id}/reset-password`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to send password reset')
      
      // In development, show the reset link in a toast for easy testing
      if (data.resetLink) {
        toast.success('Password reset link generated (dev mode). Copy from console.', { duration: 8000 })
        console.info('[DEV] Password reset link for', employee.email, ':', data.resetLink)
      } else {
        toast.success(data.message || 'Password reset email sent to employee.')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const isActive = employee.status === 'active'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(employee.employeeCode)}>
          Copy Employee Code
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* View / Edit Sheet */}
        <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) setIsEditing(false); }}>
          <SheetTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>View Details</DropdownMenuItem>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
            {isEditing ? (
              <>
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-2xl font-bold font-heading">Edit Employee</SheetTitle>
                  <SheetDescription>Update information for {employee.firstName} {employee.lastName}</SheetDescription>
                </SheetHeader>
                <EmployeeForm
                  initialData={{
                    id: employee.id,
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    email: employee.email,
                    employmentType: "full_time",
                    startDate: new Date().toISOString().split('T')[0],
                    designationId: "",
                  } as any}
                  onCancel={() => setIsEditing(false)}
                  onSuccess={() => { setIsEditing(false); setIsOpen(false); onRefresh?.() }}
                />
              </>
            ) : (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold font-heading">{employee.firstName} {employee.lastName}</SheetTitle>
                  <SheetDescription>Employee details and records</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500 font-medium">Employee Code</p>
                    <p className="font-mono text-sm">{employee.employeeCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500 font-medium">Email Address</p>
                    <p className="font-medium">{employee.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500 font-medium">Department</p>
                    <p className="font-medium">{employee.departmentName || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500 font-medium">Status</p>
                    <Badge
                      variant={
                        employee.status === 'active' ? 'positive' :
                        employee.status === 'suspended' ? 'negative' :
                        employee.status === 'on_leave' ? 'warning' : 'default'
                      }
                      className="font-semibold tracking-wide uppercase"
                    >
                      {employee.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <SheetFooter className="absolute bottom-0 w-full left-0 p-6 border-t border-slate-100 bg-slate-50/50">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/hr/employees/${employee.id}`}>Full Profile</Link>
                  </Button>
                  <Button className="w-full" onClick={() => setIsEditing(true)}>Edit Employee</Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>

        <DropdownMenuSeparator />

        {/* Activate / Deactivate */}
        {isActive ? (
          <DropdownMenuItem
            className="text-amber-600 focus:text-amber-700 focus:bg-amber-50"
            onSelect={(e) => { e.preventDefault(); handleDeactivate() }}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Deactivate Employee"}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
            onSelect={(e) => { e.preventDefault(); handleActivate() }}
            disabled={isProcessing || employee.status === 'terminated'}
          >
            {isProcessing ? "Processing..." : "Activate Employee"}
          </DropdownMenuItem>
        )}

        {/* Reset Password */}
        <DropdownMenuItem
          className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
          onSelect={(e) => { e.preventDefault(); handleResetPassword() }}
          disabled={isProcessing}
        >
          Reset Password
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
