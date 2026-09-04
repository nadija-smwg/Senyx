"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ChevronLeft,
  Building,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Power,
  PowerOff,
  KeyRound,
  Pencil,
  MoreHorizontal,
  IdCard,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"

import { DocumentList } from "@/components/shared/document-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   Types & helpers
   ────────────────────────────────────────────────────────────────────────── */

type EmployeeStatus = "active" | "on_leave" | "suspended" | "terminated"

const statusMeta: Record<
  EmployeeStatus,
  { label: string; variant: "positive" | "warning" | "negative" | "neutral"; dot: string }
> = {
  active: { label: "Active", variant: "positive", dot: "bg-emerald-500" },
  on_leave: { label: "On Leave", variant: "warning", dot: "bg-amber-500" },
  suspended: { label: "Suspended", variant: "negative", dot: "bg-rose-500" },
  terminated: { label: "Terminated", variant: "neutral", dot: "bg-slate-400" },
}

const employmentTypeMeta: Record<string, { label: string }> = {
  full_time: { label: "Full-time" },
  part_time: { label: "Part-time" },
  contract: { label: "Contract" },
  intern: { label: "Intern" },
}

function initials(first?: string, last?: string) {
  const a = (first || "").trim()[0] || ""
  const b = (last || "").trim()[0] || ""
  return (a + b).toUpperCase() || "?"
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}

function tenureYears(start?: string) {
  if (!start) return null
  const startDate = new Date(start)
  if (isNaN(startDate.getTime())) return null
  const now = new Date()
  let months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth())
  if (now.getDate() < startDate.getDate()) months -= 1
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (years === 0) return `${remMonths} mo`
  if (remMonths === 0) return `${years} yr`
  return `${years} yr ${remMonths} mo`
}

/* ──────────────────────────────────────────────────────────────────────────
   Status Badge
   ────────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const meta = statusMeta[status] || statusMeta.terminated
  return (
    <Badge variant={meta.variant} className="gap-1.5 px-2 py-0.5 text-[11px]">
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      <span className="font-bold tracking-wide">{meta.label.toUpperCase()}</span>
    </Badge>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Definition list row (used in info sections)
   ────────────────────────────────────────────────────────────────────────── */

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500 ring-1 ring-slate-200/70">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-800 break-words">{children}</div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Section (grouped info)
   ────────────────────────────────────────────────────────────────────────── */

function InfoSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </header>
      <div className="divide-y divide-slate-100 px-5">{children}</div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────────────── */

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSensitive, setShowSensitive] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEmployee = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await fetch(`/api/employees/${params.id}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const json = await res.json()
      setEmployee(json.data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load employee")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (params.id) fetchEmployee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  /* ── Action handlers (same endpoints as before) ──────────────────────── */

  const handleActivate = async () => {
    if (actionBusy) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/employees/${params.id}/activate`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to activate employee")
      toast.success(data.message || "Employee activated successfully.")
      await fetchEmployee(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionBusy(false)
    }
  }

  const handleDeactivate = async () => {
    if (actionBusy) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/employees/${params.id}/deactivate`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to deactivate employee")
      toast.success(data.message || "Employee deactivated.")
      await fetchEmployee(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionBusy(false)
    }
  }

  const handleResetPassword = async () => {
    if (actionBusy) return
    setActionBusy(true)
    try {
      const res = await fetch(`/api/employees/${params.id}/reset-password`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to send password reset")

      if (data.resetLink) {
        toast.success("Password reset link generated (dev mode). See console.", { duration: 8000 })
        console.info("[DEV] Password reset link:", data.resetLink)
      } else {
        toast.success(data.message || "Password reset email sent to employee.")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionBusy(false)
    }
  }

  const handleCopyCode = () => {
    if (!employee?.employeeCode) return
    navigator.clipboard.writeText(employee.employeeCode)
    toast.success("Employee code copied")
  }

  /* ── Loading / empty states ─────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-6 h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" asChild className="mb-4">
          <Link href="/hr/employees" aria-label="Back to employees">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Employee not found</h2>
          <p className="mt-1 text-sm text-slate-500">
            The requested employee record could not be loaded.
          </p>
        </div>
      </div>
    )
  }

  /* ── Derived display values ─────────────────────────────────────────── */

  const status: EmployeeStatus = (employee.status as EmployeeStatus) || "terminated"
  const statusInfo = statusMeta[status] || statusMeta.terminated
  const fullName = `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || "—"
  const employmentTypeLabel =
    employmentTypeMeta[employee.employmentType]?.label ||
    (employee.employmentType ? employee.employmentType.replace("_", " ") : "—")
  const tenure = tenureYears(employee.startDate)

  const isActive = status === "active"
  const isTerminated = status === "terminated"
  const isSuspended = status === "suspended"
  const showDeactivate = isActive
  const showActivate = !isActive && !isTerminated

  const emergency = employee.emergencyContact as
    | { name?: string; phone?: string; relation?: string }
    | null
    | undefined

  const bankDetails = employee.bankDetails as
    | { bankName?: string; accountNumber?: string; branch?: string }
    | null
    | undefined

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {/* ── Top bar: Back + breadcrumb-style title ─────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-600 hover:text-slate-900">
          <Link href="/hr/employees">
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span>Back to Employees</span>
          </Link>
        </Button>
      </div>

      {/* ── Profile header (Primary identity) ──────────────────────────── */}
      <Card className="overflow-hidden border-slate-200">
        <div className="relative">
          {/* Subtle accent strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#22BFE8] via-[#1A6DB6] to-[#0F4A82]" />

          <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:gap-8">
            {/* Avatar + identity */}
            <div className="flex items-start gap-4 sm:gap-5">
              <Avatar className="h-20 w-20 shrink-0 ring-4 ring-white sm:h-24 sm:w-24">
                <AvatarFallback className="text-2xl font-bold sm:text-3xl">
                  {initials(employee.firstName, employee.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {fullName}
                  </h1>
                  <StatusBadge status={status} />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Copy employee code"
                  >
                    <IdCard className="h-3.5 w-3.5" />
                    <span>{employee.employeeCode}</span>
                    <Copy className="h-3 w-3 opacity-60" />
                  </button>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                  <span className="font-medium text-slate-700">
                    {employee.designationTitle || "—"}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                  <span className="text-slate-500">
                    {employee.departmentName || "No department"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  <a
                    href={`mailto:${employee.email}`}
                    className="truncate text-blue-600 hover:underline"
                  >
                    {employee.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Primary action buttons (right side / wrap on mobile) */}
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPassword}
                disabled={actionBusy}
                className="gap-1.5"
              >
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline">Reset Password</span>
                <span className="sm:hidden">Reset</span>
              </Button>

              {showActivate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleActivate}
                  disabled={actionBusy}
                  className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Power className="h-4 w-4" />
                  Activate
                </Button>
              )}

              {showDeactivate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeactivate}
                  disabled={actionBusy}
                  className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <PowerOff className="h-4 w-4" />
                  Deactivate
                </Button>
              )}

              {/* More menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </DropdownMenuLabel>
                  <DropdownMenuItem onSelect={handleCopyCode} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4 text-slate-500" />
                    Copy Employee Code
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      router.push(`/hr/employees`)
                    }}
                    className="cursor-pointer"
                  >
                    <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                    Edit from list
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => { e.preventDefault(); handleResetPassword() }}
                    disabled={actionBusy}
                    className="cursor-pointer text-blue-700 focus:text-blue-800 focus:bg-blue-50"
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Send Password Reset
                  </DropdownMenuItem>
                  {showDeactivate && (
                    <DropdownMenuItem
                      onSelect={(e) => { e.preventDefault(); handleDeactivate() }}
                      disabled={actionBusy}
                      className="cursor-pointer text-amber-700 focus:text-amber-800 focus:bg-amber-50"
                    >
                      <PowerOff className="mr-2 h-4 w-4" />
                      Deactivate Employee
                    </DropdownMenuItem>
                  )}
                  {showActivate && (
                    <DropdownMenuItem
                      onSelect={(e) => { e.preventDefault(); handleActivate() }}
                      disabled={actionBusy}
                      className="cursor-pointer text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50"
                    >
                      <Power className="mr-2 h-4 w-4" />
                      Activate Employee
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Key employment strip (Important employment info) ────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Briefcase}
          label="Position"
          value={employee.designationTitle || "—"}
        />
        <StatTile
          icon={Building}
          label="Department"
          value={employee.departmentName || "—"}
        />
        <StatTile
          icon={ShieldCheck}
          label="Employment Type"
          value={employmentTypeLabel}
        />
        <StatTile
          icon={Clock}
          label="Tenure"
          value={tenure ?? "—"}
          hint={employee.startDate ? `Since ${formatDate(employee.startDate)}` : undefined}
        />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills Matrix</TabsTrigger>
            <TabsTrigger value="leave">Leave & Time Off</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Overview tab ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contact Information */}
            <InfoSection title="Contact Information" description="How to reach this employee.">
              <InfoRow icon={Mail} label="Email">
                {employee.email ? (
                  <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                    {employee.email}
                  </a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </InfoRow>
              <InfoRow icon={Phone} label="Phone">
                {employee.phone ? (
                  <a href={`tel:${employee.phone}`} className="hover:underline">
                    {employee.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </InfoRow>
            </InfoSection>

            {/* Employment Information */}
            <InfoSection title="Employment Information" description="Role, tenure and lifecycle dates.">
              <InfoRow icon={Briefcase} label="Designation">
                {employee.designationTitle || (
                  <span className="text-slate-400">Not assigned</span>
                )}
              </InfoRow>
              <InfoRow icon={Building} label="Department">
                {employee.departmentName || (
                  <span className="text-slate-400">Not assigned</span>
                )}
              </InfoRow>
              <InfoRow icon={ShieldCheck} label="Employment Type">
                {employmentTypeLabel}
              </InfoRow>
              <InfoRow icon={Calendar} label="Start Date">
                {formatDate(employee.startDate)}
              </InfoRow>
              <InfoRow icon={Calendar} label="End Date">
                {formatDate(employee.endDate)}
              </InfoRow>
              <InfoRow icon={CheckCircle2} label="Status">
                <StatusBadge status={status} />
              </InfoRow>
            </InfoSection>

            {/* Personal Information — Emergency contact */}
            <InfoSection
              title="Personal Information"
              description="Emergency contact on record."
            >
              {emergency && (emergency.name || emergency.phone || emergency.relation) ? (
                <>
                  <InfoRow icon={IdCard} label="Contact Name">
                    {emergency.name || <span className="text-slate-400">Not provided</span>}
                  </InfoRow>
                  <InfoRow icon={Phone} label="Contact Phone">
                    {emergency.phone ? (
                      <a href={`tel:${emergency.phone}`} className="hover:underline">
                        {emergency.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400">Not provided</span>
                    )}
                  </InfoRow>
                  <InfoRow icon={Briefcase} label="Relationship">
                    {emergency.relation || <span className="text-slate-400">Not provided</span>}
                  </InfoRow>
                </>
              ) : (
                <div className="py-6 text-center text-sm text-slate-500">
                  No emergency contact on record.
                </div>
              )}
            </InfoSection>

            {/* Sensitive Information */}
            <InfoSection
              title="Sensitive Information"
              description="Confidential — HR & Admins only."
            >
              <div className="flex items-center justify-end pb-1 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="h-7 gap-1.5 px-2 text-xs text-slate-500 hover:text-slate-900"
                >
                  {showSensitive ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Reveal
                    </>
                  )}
                </Button>
              </div>

              <InfoRow icon={ShieldCheck} label="Annual Salary">
                {showSensitive ? (
                  employee.salary ? (
                    <span className="font-mono">${employee.salary}</span>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )
                ) : (
                  <span className="font-mono tracking-widest text-slate-400">••••••••</span>
                )}
              </InfoRow>

              <InfoRow icon={IdCard} label="National ID / SSN">
                {showSensitive ? (
                  employee.nationalId ? (
                    <span className="font-mono">{employee.nationalId}</span>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )
                ) : (
                  <span className="font-mono tracking-widest text-slate-400">••••••••</span>
                )}
              </InfoRow>

              {bankDetails && (
                <>
                  <InfoRow icon={Building} label="Bank Name">
                    {showSensitive ? (
                      bankDetails.bankName || <span className="text-slate-400">Not set</span>
                    ) : (
                      <span className="font-mono tracking-widest text-slate-400">••••••••</span>
                    )}
                  </InfoRow>
                  <InfoRow icon={IdCard} label="Account Number">
                    {showSensitive ? (
                      bankDetails.accountNumber || <span className="text-slate-400">Not set</span>
                    ) : (
                      <span className="font-mono tracking-widest text-slate-400">••••••••</span>
                    )}
                  </InfoRow>
                  <InfoRow icon={Briefcase} label="Branch">
                    {showSensitive ? (
                      bankDetails.branch || <span className="text-slate-400">Not set</span>
                    ) : (
                      <span className="font-mono tracking-widest text-slate-400">••••••••</span>
                    )}
                  </InfoRow>
                </>
              )}
            </InfoSection>
          </div>
        </TabsContent>

        {/* ── Skills tab ───────────────────────────────────────────────── */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Matrix</CardTitle>
              <CardDescription>Verified competencies and proficiency levels.</CardDescription>
            </CardHeader>
            <CardContent>
              {employee.skills && employee.skills.length > 0 ? (
                <div className="space-y-4">
                  {employee.skills.map((skill: any) => (
                    <div key={skill.skillId} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{skill.skillName}</p>
                        <p className="text-sm text-slate-500">{skill.category}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1" aria-label={`Proficiency ${skill.proficiency} of 5`}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                "h-2 w-8 rounded-full",
                                level <= skill.proficiency ? "bg-primary" : "bg-slate-200"
                              )}
                            />
                          ))}
                        </div>
                        {skill.certified && (
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                            Certified
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-slate-500">
                  No skills recorded.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Leave tab ────────────────────────────────────────────────── */}
        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
              <CardDescription>
                Current year balances across leave types.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employee.leaveBalances && employee.leaveBalances.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {employee.leaveBalances.map((lb: any) => (
                    <div
                      key={lb.id}
                      className="rounded-lg border border-slate-200 p-4 text-center"
                    >
                      <p className="text-3xl font-bold tabular-nums text-slate-900">
                        {lb.balanceDays}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{lb.leaveTypeName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-slate-500">
                  No active leave balances.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payroll tab ──────────────────────────────────────────────── */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>Past payroll runs for this employee.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-10 text-center text-sm text-slate-500">
                Payroll integration coming in Phase 4.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documents tab ────────────────────────────────────────────── */}
        <TabsContent value="documents">
          <DocumentList
            ownerType="employee"
            ownerId={employee.id}
            title="Employee Documents"
            description="Manage contracts, NDAs, and other HR documents."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Small stat tile (used in the key-strip)
   ────────────────────────────────────────────────────────────────────────── */

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-slate-900 truncate" title={value}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-slate-500 truncate">{hint}</div>}
    </div>
  )
}
