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
import Link from "next/link"

export type Employee = {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  departmentName?: string
  designationTitle?: string
  status: "active" | "on_leave" | "suspended" | "terminated"
}

export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "employeeCode",
    header: "Code",
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
      const statusClasses: Record<string, string> = {
        'active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'on_leave': 'bg-amber-100 text-amber-700 border-amber-200',
        'suspended': 'bg-rose-100 text-rose-700 border-rose-200',
        'terminated': 'bg-slate-100 text-slate-700 border-slate-200',
      }
      
      const cn = statusClasses[status] || statusClasses['terminated'];
      
      return <Badge className={`font-semibold tracking-wide ${cn}`} variant="outline">{status.replace('_', ' ').toUpperCase()}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(employee.employeeCode)}
            >
              Copy Employee Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/hr/employees/${employee.id}`}>View Details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
