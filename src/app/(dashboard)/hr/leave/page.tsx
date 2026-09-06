"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Hourglass,
  Inbox,
  TrendingUp,
  Check,
  X,
  MessageSquare,
  ChevronDown,
  Filter as FilterIcon,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/data/data-table"
import { useAuth } from "@/hooks/use-auth"
import { LeaveRequestModal } from "@/components/hr/leave-request-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/page-header"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────────────── */

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled"

type LeaveRequest = {
  id: string
  leaveTypeName?: string
  leaveTypeId?: string
  startDate: string
  endDate: string
  days: string | number
  status: string
  reason?: string | null
  employeeName?: string
  employeeCode?: string
  departmentName?: string
  approverComment?: string | null
  decidedAt?: string | null
  createdAt?: string
  employeeId?: string
}

type LeaveBalance = {
  id: string
  leaveTypeId: string
  leaveTypeName?: string
  year: number
  balanceDays: string
}

/* ──────────────────────────────────────────────────────────────────────────
   Status presentation
   ────────────────────────────────────────────────────────────────────────── */

const statusMeta: Record<
  LeaveStatus,
  { label: string; variant: "positive" | "negative" | "warning" | "neutral"; dot: string }
> = {
  pending: { label: "Pending", variant: "warning", dot: "bg-amber-500" },
  approved: { label: "Approved", variant: "positive", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", variant: "negative", dot: "bg-rose-500" },
  cancelled: { label: "Cancelled", variant: "neutral", dot: "bg-slate-400" },
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status as LeaveStatus] || {
    label: status,
    variant: "neutral" as const,
    dot: "bg-slate-400",
  }
  return (
    <Badge variant={meta.variant} className="gap-1.5 px-2 py-0.5 text-[11px]">
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      <span className="font-bold tracking-wide">{meta.label.toUpperCase()}</span>
    </Badge>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────── */

function initials(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?"
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}

function formatDateShort(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" })
}

function durationDays(start?: string, end?: string) {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
  const diff = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff
}

/* ──────────────────────────────────────────────────────────────────────────
   KPI tile (visual language matches Dashboard)
   ────────────────────────────────────────────────────────────────────────── */

const kpiStatusConfig = {
  pending: { iconBg: "#FEF0EB", iconColor: "#F15A22", accent: "#F15A22" },
  approved: { iconBg: "#ECFDF5", iconColor: "#059669", accent: "#059669" },
  rejected: { iconBg: "#FCECEC", iconColor: "#C1172C", accent: "#C1172C" },
  total: { iconBg: "#E9F5FA", iconColor: "#1A6DB6", accent: "#1A6DB6" },
} as const

function KpiTile({
  title,
  value,
  hint,
  icon,
  status,
}: {
  title: string
  value: number | string
  hint?: string
  icon: React.ReactNode
  status: keyof typeof kpiStatusConfig
}) {
  const cfg = kpiStatusConfig[status]
  return (
    <div className="relative h-full rounded-xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl"
        style={{ backgroundColor: cfg.accent, opacity: 0.85 }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          {title}
        </p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: cfg.iconBg, color: cfg.iconColor }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 font-heading text-[26px] font-bold leading-tight tracking-tight text-gray-900 tabular-nums">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────────────── */

export default function LeavePage() {
  const { roles, isLoading: authLoading } = useAuth()
  const isAdmin = roles.includes("Admin")

  const [data, setData] = useState<LeaveRequest[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [balancesLoading, setBalancesLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchLeave = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const res = await fetch("/api/leave-requests")
      if (!res.ok) throw new Error("Failed to load leave requests")
      const json = await res.json()
      setData(Array.isArray(json.data) ? json.data : [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Could not load leave requests.")
      toast.error(err?.message || "Could not load leave requests")
    } finally {
      setLoading(false)
    }
  }

  const fetchBalances = async (silent = false) => {
    try {
      if (!silent) setBalancesLoading(true)
      const res = await fetch("/api/leave-balances")
      if (!res.ok) return // Non-admin endpoint; quietly skip
      const json = await res.json()
      setBalances(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      // Silent — non-admins / users without employee profile won't have balances
    } finally {
      setBalancesLoading(false)
    }
  }

  useEffect(() => {
    fetchLeave()
    if (!isAdmin) fetchBalances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  /* ── Decision handler (used by admin UI) ──────────────────────────────── */

  const handleDecision = async (
    id: string,
    decision: "approved" | "rejected",
    comment?: string
  ) => {
    try {
      const res = await fetch(`/api/leave-requests/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || "Failed to submit decision")
      }
      toast.success(`Leave request ${decision}`)
      setRefreshKey((k) => k + 1)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  /* ── Derived data ─────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    let pending = 0
    let approved = 0
    let rejected = 0
    const year = new Date().getFullYear()
    let yearTotal = 0
    for (const r of data) {
      if (r.status === "pending") pending++
      else if (r.status === "approved") approved++
      else if (r.status === "rejected") rejected++
      if (r.createdAt) {
        const y = new Date(r.createdAt).getFullYear()
        if (y === year) yearTotal++
      }
    }
    return { pending, approved, rejected, yearTotal }
  }, [data])

  const pendingRequests = useMemo(
    () =>
      data
        .filter((r) => r.status === "pending")
        .sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return db - da
        }),
    [data]
  )

  /* ── Admin Approve / Reject dialog ────────────────────────────────────── */

  const [decisionDialog, setDecisionDialog] = useState<{
    open: boolean
    request: LeaveRequest | null
    type: "approved" | "rejected" | null
    comment: string
    submitting: boolean
  }>({ open: false, request: null, type: null, comment: "", submitting: false })

  const openDecision = (req: LeaveRequest, type: "approved" | "rejected") => {
    setDecisionDialog({ open: true, request: req, type, comment: "", submitting: false })
  }

  const closeDecision = () => {
    if (decisionDialog.submitting) return
    setDecisionDialog((s) => ({ ...s, open: false }))
  }

  const submitDecision = async () => {
    if (!decisionDialog.request || !decisionDialog.type) return
    setDecisionDialog((s) => ({ ...s, submitting: true }))
    await handleDecision(
      decisionDialog.request.id,
      decisionDialog.type,
      decisionDialog.comment.trim() || undefined
    )
    setDecisionDialog({ open: false, request: null, type: null, comment: "", submitting: false })
  }

  /* ── Table columns (richer cell renderers, kept inline) ──────────────── */

  const columns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: "employeeName",
      header: "Employee",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white shadow-sm">
              <AvatarFallback className="text-[10px] font-bold">
                {initials(r.employeeName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">
                {r.employeeName || "Unknown"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                {r.employeeCode && (
                  <span className="font-mono">{r.employeeCode}</span>
                )}
                {r.employeeCode && r.departmentName && (
                  <span className="text-slate-300">•</span>
                )}
                {r.departmentName && <span className="truncate">{r.departmentName}</span>}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "leaveTypeName",
      header: "Leave Type",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-800">
          {row.original.leaveTypeName || "—"}
        </span>
      ),
    },
    {
      id: "dates",
      accessorKey: "startDate",
      header: "Dates",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="text-sm leading-tight">
            <div className="font-medium text-slate-900">
              {formatDateShort(r.startDate)}
              <span className="mx-1.5 text-slate-400">→</span>
              {formatDateShort(r.endDate)}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {formatDate(r.startDate).split(", ")[1]} – {formatDate(r.endDate).split(", ")[1]}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "days",
      header: "Days",
      cell: ({ row }) => {
        const days = parseFloat(String(row.original.days))
        const valid = !isNaN(days)
        return (
          <span
            className={cn(
              "inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-full px-2.5 text-xs font-semibold tabular-nums",
              valid ? "bg-slate-100 text-slate-800" : "text-slate-400"
            )}
          >
            {valid ? days : "—"}
          </span>
        )
      },
    },
    {
      id: "submitted",
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 tabular-nums">
          {row.original.createdAt ? formatDate(row.original.createdAt) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    ...(isAdmin
      ? [
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }: { row: { original: LeaveRequest } }) =>
            row.original.status === "pending" ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => openDecision(row.original, "approved")}
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => openDecision(row.original, "rejected")}
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            ),
        } as ColumnDef<LeaveRequest>,
      ]
      : []),
  ]

  /* ── Loading state (page-level skeleton) ──────────────────────────────── */

  if (loading && data.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  /* ── Error state ──────────────────────────────────────────────────────── */

  if (error && !loading && data.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <PageHeader
          pretitle="HR & People"
          title="Leave Management"
          description="View and manage your time off."
        />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 px-6 py-12 text-center">
          <AlertTriangle className="mb-3 h-8 w-8 text-rose-500" />
          <h3 className="text-base font-semibold text-slate-900">Could not load leave requests</h3>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
          <Button onClick={() => setRefreshKey((k) => k + 1)} className="mt-4 gap-1.5">
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      </div>
    )
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <PageHeader
        pretitle="HR & People"
        title="Leave Management"
        description={
          isAdmin
            ? "Review employee leave requests, manage balances and track time-off across the organization."
            : "Submit, track and review your personal leave requests and balances."
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              className="gap-1.5 bg-white"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            {!authLoading && isAdmin && (
              <Button variant="outline" size="sm" asChild className="bg-white">
                <Link href="/hr/designations">Manage Leave Days</Link>
              </Button>
            )}
            {!authLoading && !isAdmin && (
              <LeaveRequestModal onSuccess={() => setRefreshKey((k) => k + 1)} />
            )}
          </>
        }
      />

      {/* ── KPI / Summary strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile
          title="Pending"
          value={stats.pending}
          hint={isAdmin ? "Awaiting your decision" : "In review"}
          icon={<Hourglass className="h-[18px] w-[18px]" />}
          status="pending"
        />
        <KpiTile
          title="Approved"
          value={stats.approved}
          hint={isAdmin ? "Across organization" : "This account"}
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
          status="approved"
        />
        <KpiTile
          title="Rejected"
          value={stats.rejected}
          hint="This year"
          icon={<XCircle className="h-[18px] w-[18px]" />}
          status="rejected"
        />
        <KpiTile
          title={isAdmin ? "Total Requests" : "Your Requests"}
          value={stats.yearTotal}
          hint={`Year ${new Date().getFullYear()}`}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          status="total"
        />
      </div>

      {/* ── Admin: Pending approvals panel (immediately visible) ────────── */}
      {isAdmin && (
        <PendingPanel
          requests={pendingRequests}
          loading={loading}
          onApprove={(r) => openDecision(r, "approved")}
          onReject={(r) => openDecision(r, "rejected")}
        />
      )}

      {/* ── Non-admin: Leave balances panel ──────────────────────────────── */}
      {!isAdmin && <BalancesPanel balances={balances} loading={balancesLoading} />}

      {/* ── All requests table ──────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isAdmin ? "All Leave Requests" : "My Leave Requests"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {data.length} total · {stats.pending} pending · {stats.approved} approved
            </p>
          </div>
        </header>

        {data.length === 0 && !loading ? (
          <EmptyState isAdmin={isAdmin} />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchKey="employeeName"
            searchPlaceholder={
              isAdmin
                ? "Search by employee, code, department…"
                : "Search by leave type…"
            }
            isLoading={loading}
            dateFilterColumn="startDate"
            renderSubComponent={({ row }) => <RequestDetails request={row.original} />}
          />
        )}
      </section>

      {/* ── Decision dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={decisionDialog.open}
        onOpenChange={(open) => (open ? null : closeDecision())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionDialog.type === "approved"
                ? "Approve Leave Request"
                : decisionDialog.type === "rejected"
                  ? "Reject Leave Request"
                  : "Decide Leave Request"}
            </DialogTitle>
            <DialogDescription>
              Add an optional comment for {decisionDialog.request?.employeeName || "this employee"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <textarea
                id="comment"
                rows={3}
                value={decisionDialog.comment}
                onChange={(e) =>
                  setDecisionDialog((s) => ({ ...s, comment: e.target.value }))
                }
                placeholder="Enter your remarks here…"
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A6DB6]/40 focus-visible:ring-offset-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={closeDecision} disabled={decisionDialog.submitting}>
                Cancel
              </Button>
              <Button
                onClick={submitDecision}
                disabled={decisionDialog.submitting}
                className={cn(
                  decisionDialog.type === "rejected" &&
                  "bg-[#C1172C] text-white hover:bg-[#A51224]"
                )}
              >
                {decisionDialog.submitting
                  ? "Submitting…"
                  : decisionDialog.type === "approved"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Pending approvals panel (admin only)
   ────────────────────────────────────────────────────────────────────────── */

function PendingPanel({
  requests,
  loading,
  onApprove,
  onReject,
}: {
  requests: LeaveRequest[]
  loading: boolean
  onApprove: (r: LeaveRequest) => void
  onReject: (r: LeaveRequest) => void
}) {
  if (loading && requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 bg-amber-50/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEF0EB] text-[#F15A22]">
            <Hourglass className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Pending Approvals</CardTitle>
            <CardDescription>
              {requests.length === 0
                ? "You're all caught up — no pending requests."
                : `${requests.length} request${requests.length === 1 ? "" : "s"} awaiting your decision`}
            </CardDescription>
          </div>
        </div>
        {requests.length > 0 && (
          <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
            <span className="font-bold">{requests.length} PENDING</span>
          </Badge>
        )}
      </CardHeader>

      {requests.length === 0 ? (
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-900">All caught up!</p>
            <p className="mt-1 text-xs text-slate-500">
              There are no leave requests awaiting approval.
            </p>
          </div>
        </CardContent>
      ) : (
        <CardContent className="space-y-3 p-4 sm:p-5">
          {requests.slice(0, 5).map((r) => (
            <PendingRow
              key={r.id}
              request={r}
              onApprove={() => onApprove(r)}
              onReject={() => onReject(r)}
            />
          ))}
          {requests.length > 5 && (
            <div className="pt-1 text-center text-xs text-slate-500">
              + {requests.length - 5} more pending request{requests.length - 5 === 1 ? "" : "s"} below in the table
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function PendingRow({
  request,
  onApprove,
  onReject,
}: {
  request: LeaveRequest
  onApprove: () => void
  onReject: () => void
}) {
  const days = durationDays(request.startDate, request.endDate)
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50/40 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white shadow-sm">
          <AvatarFallback className="text-xs font-bold">
            {initials(request.employeeName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-slate-900">
              {request.employeeName || "Unknown"}
            </p>
            {request.employeeCode && (
              <span className="font-mono text-xs text-slate-400">
                · {request.employeeCode}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {request.leaveTypeName || "Leave"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="tabular-nums">
              {formatDateShort(request.startDate)} → {formatDateShort(request.endDate)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="tabular-nums">
              {request.days || (days ?? "—")} day{parseFloat(String(request.days || "0")) === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          className="h-9 flex-1 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 sm:flex-none"
        >
          <X className="h-4 w-4" /> Reject
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          className="h-9 flex-1 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
        >
          <Check className="h-4 w-4" /> Approve
        </Button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Leave balances panel (non-admin)
   ────────────────────────────────────────────────────────────────────────── */

function BalancesPanel({
  balances,
  loading,
}: {
  balances: LeaveBalance[]
  loading: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (balances.length === 0) return null

  const year = new Date().getFullYear()
  const currentYearBalances = balances.filter((b) => b.year === year)
  if (currentYearBalances.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E9F5FA] text-[#1A6DB6]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">My Leave Balances</CardTitle>
            <CardDescription>Days remaining for {year}.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {currentYearBalances.map((b) => {
            const days = parseFloat(b.balanceDays)
            const numeric = isNaN(days) ? 0 : days
            return (
              <div
                key={b.id}
                className="rounded-xl border border-slate-200 bg-white p-4 text-center transition-colors hover:border-slate-300"
              >
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  {b.leaveTypeName || "Leave"}
                </p>
                <p className="font-heading text-3xl font-bold tabular-nums text-slate-900">
                  {numeric}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {numeric === 1 ? "day" : "days"} available
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Expanded row: full request details
   ────────────────────────────────────────────────────────────────────────── */

function RequestDetails({ request }: { request: LeaveRequest }) {
  const days = parseFloat(String(request.days))
  return (
    <div className="grid grid-cols-1 gap-4 bg-slate-50/50 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
      <DetailItem label="Reason" value={request.reason || "No reason provided"} />
      <DetailItem
        label="Duration"
        value={
          isNaN(days)
            ? "—"
            : `${days} day${days === 1 ? "" : "s"} (${formatDateShort(
              request.startDate
            )} → ${formatDateShort(request.endDate)})`
        }
      />
      <DetailItem
        label="Status"
        value={<StatusBadge status={request.status} />}
      />
      <DetailItem
        label="Decided"
        value={
          request.decidedAt
            ? `${formatDate(request.decidedAt)}${request.approverComment ? ` — "${request.approverComment}"` : ""
            }`
            : request.status === "pending"
              ? "Awaiting decision"
              : "—"
        }
      />
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-slate-800">{value}</div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Empty state
   ────────────────────────────────────────────────────────────────────────── */

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F5FA] text-[#1A6DB6]">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">No leave requests yet</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {isAdmin
          ? "When employees submit leave requests, they will appear here for your review."
          : "You haven't submitted any leave requests yet. Use the Request Leave button above to get started."}
      </p>
      {!isAdmin && (
        <div className="mt-5">
          <LeaveRequestModal onSuccess={() => (window.location.reload())} />
        </div>
      )}
    </div>
  )
}
