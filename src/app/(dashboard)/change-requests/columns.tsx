"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/sheet"
import { MoreHorizontal, Eye, Pencil, FileText } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ChangeRequestAdminForm } from "@/components/change-requests/change-request-admin-form"

export type ChangeRequest = {
  id: string
  employeeId: string
  title: string
  description: string
  status: "pending" | "in_review" | "approved" | "rejected" | "completed"
  adminComment?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  isAdmin?: boolean // Passed down for rendering logic
}

const statusMeta: Record<
  ChangeRequest["status"],
  { label: string; variant: "positive" | "warning" | "negative" | "neutral" | "default"; dot: string }
> = {
  pending: { label: "Pending", variant: "neutral", dot: "bg-slate-400" },
  in_review: { label: "In Review", variant: "warning", dot: "bg-amber-500" },
  approved: { label: "Approved", variant: "positive", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", variant: "negative", dot: "bg-rose-500" },
  completed: { label: "Completed", variant: "default", dot: "bg-blue-500" },
}

function formatDate(value?: string) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function StatusBadge({ status }: { status: ChangeRequest["status"] }) {
  const meta = statusMeta[status] || statusMeta.pending
  return (
    <Badge variant={meta.variant} className="gap-1.5 px-2 py-0.5 text-[10px]">
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      <span className="font-bold tracking-wide">{meta.label.toUpperCase()}</span>
    </Badge>
  )
}

export const columns: ColumnDef<ChangeRequest>[] = [
  {
    accessorKey: "title",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Request</span>
    ),
    cell: ({ row }) => (
      <div className="font-semibold text-slate-900 truncate max-w-sm">{row.original.title}</div>
    ),
  },
  {
    accessorKey: "status",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</span>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submitted</span>
    ),
    cell: ({ row }) => {
      const formatted = formatDate(row.original.createdAt)
      return <span className="text-sm text-slate-600 tabular-nums">{formatted}</span>
    },
  },
  {
    accessorKey: "updatedAt",
    header: () => (
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Last Updated</span>
    ),
    cell: ({ row }) => {
      const formatted = formatDate(row.original.updatedAt)
      return <span className="text-sm text-slate-600 tabular-nums">{formatted}</span>
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => (
      <ChangeRequestActions
        request={row.original}
        onRefresh={(table.options.meta as any)?.onRefresh}
      />
    ),
    enableHiding: false,
  },
]

function ChangeRequestActions({ request, onRefresh }: { request: ChangeRequest; onRefresh?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // For Admin edit view

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
        
        <DropdownMenuSeparator />

        <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setIsEditing(false); }}>
          <SheetTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              <Eye className="h-4 w-4 mr-2 text-slate-500" />
              View Details
            </DropdownMenuItem>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[500px] flex flex-col p-0">
            {isEditing && request.isAdmin ? (
               <>
                <SheetHeader className="px-6 py-6 border-b shrink-0">
                  <SheetTitle className="text-2xl font-bold font-heading">Update Request</SheetTitle>
                  <SheetDescription>Change the status and add an admin response.</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4 relative h-full">
                  <ChangeRequestAdminForm 
                    request={request}
                    onCancel={() => setIsEditing(false)}
                    onSuccess={() => { setIsEditing(false); setIsOpen(false); onRefresh?.(); }}
                  />
                </div>
               </>
            ) : (
              <>
                <SheetHeader className="px-6 py-6 border-b shrink-0">
                  <SheetTitle className="text-xl font-bold font-heading break-words">{request.title}</SheetTitle>
                  <div className="mt-2">
                     <StatusBadge status={request.status} />
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</p>
                    <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-md border border-slate-100">
                      {request.description}
                    </div>
                  </div>

                  {request.adminComment && (
                     <div>
                       <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admin Response</p>
                       <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap bg-blue-50/50 p-3 rounded-md border border-blue-100">
                         {request.adminComment}
                       </div>
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted</p>
                      <p className="mt-1 text-sm font-medium text-slate-800 tabular-nums">{formatDate(request.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Last Updated</p>
                      <p className="mt-1 text-sm font-medium text-slate-800 tabular-nums">{formatDate(request.updatedAt)}</p>
                    </div>
                  </div>
                </div>
                {request.isAdmin && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <Button className="w-full" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" /> Update Status
                    </Button>
                  </div>
                )}
              </>
            )}
          </SheetContent>
        </Sheet>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
