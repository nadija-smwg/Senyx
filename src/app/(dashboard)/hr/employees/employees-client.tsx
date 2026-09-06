"use client"

import { useEffect, useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { columns, Employee } from "./columns"
import { DataTable } from "@/components/data/data-table"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Inbox,
  Building2,
  ShieldCheck,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { EmployeeForm } from "@/components/hr/employee-form"
import { CredentialDialog } from "@/components/hr/credential-dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const ALL = "__all__"

export function EmployeesClient({ initialData }: { initialData: Employee[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<Employee[]>(initialData)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState<string>(ALL)
  const [status, setStatus] = useState<string>(ALL)

  // Credential Dialog state for new employee creation
  const [credentialDialog, setCredentialDialog] = useState<{
    open: boolean;
    employeeName: string;
    email: string;
    tempPassword: string;
  }>({ open: false, employeeName: '', email: '', tempPassword: '' })

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  /* ── Derived: department options & counts ─────────────────────────────── */
  const departmentOptions = useMemo(() => {
    const map = new Map<string, string>()
    data.forEach((d) => {
      if (d.departmentName) map.set(d.departmentName, d.departmentName)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [data])

  /* ── Derived: stats ───────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = data.length
    const active = data.filter((d) => d.status === "active").length
    const inactive = total - active
    const departments = new Set(data.map((d) => d.departmentName).filter(Boolean)).size
    return { total, active, inactive, departments }
  }, [data])

  /* ── Derived: filtered list (client-side) ─────────────────────────────── */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.filter((e) => {
      const matchesSearch =
        !term ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(term) ||
        e.email?.toLowerCase().includes(term) ||
        e.employeeCode?.toLowerCase().includes(term) ||
        e.designationTitle?.toLowerCase().includes(term)
      const matchesDept = department === ALL || e.departmentName === department
      const matchesStatus = status === ALL || e.status === status
      return matchesSearch && matchesDept && matchesStatus
    })
  }, [data, search, department, status])

  const activeFilters = (department !== ALL ? 1 : 0) + (status !== ALL ? 1 : 0) + (search ? 1 : 0)

  const clearFilters = () => {
    setSearch("")
    setDepartment(ALL)
    setStatus(ALL)
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 animate-in fade-in duration-500">

      {/* ============================================================== */}
      {/*  PAGE HEADER                                                   */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[180%] rounded-[100%] bg-gradient-to-br from-[#22BFE8]/12 via-[#7F4D9F]/8 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60%] left-[-10%] w-[40%] h-[180%] rounded-[100%] bg-gradient-to-tr from-[#F9A01B]/10 via-[#EC4C49]/8 to-transparent blur-3xl pointer-events-none" />
        <div className="relative px-6 py-5 md:px-7 md:py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#1A6DB6] via-[#7F4D9F] to-[#F15A22] bg-clip-text text-transparent">
              HR & People
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold font-heading text-gray-900 tracking-tight">
              Employees
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
              Manage your organization's employee directory. View roles, update details, and onboard new team members.
            </p>

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="default" className="gap-1.5 px-2.5 py-1 text-[11px]">
                <Users className="h-3 w-3" />
                <span className="font-bold">{stats.total}</span>
                <span className="font-medium opacity-80">Total</span>
              </Badge>
              <Badge variant="positive" className="gap-1.5 px-2.5 py-1 text-[11px]">
                <UserCheck className="h-3 w-3" />
                <span className="font-bold">{stats.active}</span>
                <span className="font-medium opacity-80">Active</span>
              </Badge>
              <Badge variant="neutral" className="gap-1.5 px-2.5 py-1 text-[11px]">
                <UserX className="h-3 w-3" />
                <span className="font-bold">{stats.inactive}</span>
                <span className="font-medium opacity-80">Inactive</span>
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-[11px]">
                <Building2 className="h-3 w-3" />
                <span className="font-bold">{stats.departments}</span>
                <span className="font-medium opacity-80">Departments</span>
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-slate-600 shadow-sm bg-white"
              onClick={() => startTransition(() => router.refresh())}
              disabled={isPending}
            >
              {isPending ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2 shadow-sm shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Add Employee
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-[520px] flex flex-col p-0">
                <SheetHeader className="p-6 pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#1A6DB6] via-[#7F4D9F] to-[#F15A22] bg-clip-text text-transparent">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#1A6DB6]" />
                    <span>New Team Member</span>
                  </div>
                  <SheetTitle className="text-2xl font-bold font-heading mt-1">Add New Employee</SheetTitle>
                  <SheetDescription>
                    Create an employee record and provision their system login in one step.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-2 relative h-full">
                  <EmployeeForm
                    onSuccess={(result) => {
                      setIsSheetOpen(false)
                      
                      // If it's a creation and temp password was returned, show dialog
                      if (result && result.tempPassword) {
                        setTimeout(() => {
                          setCredentialDialog({
                            open: true,
                            employeeName: `${result.data.firstName} ${result.data.lastName}`,
                            email: result.data.email,
                            tempPassword: result.tempPassword,
                          })
                        }, 150)
                      } else {
                        startTransition(() => router.refresh())
                      }
                    }}
                    onCancel={() => setIsSheetOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/*  EMPLOYEE TABLE CARD                                           */}
      {/* ============================================================== */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-4 md:p-5 border-b border-slate-100 bg-slate-50/30 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search by name, email, ID or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-slate-200 shadow-sm rounded-xl focus-visible:shadow-md"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[170px] h-10 bg-white border-slate-200 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Department" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All departments</SelectItem>
                {departmentOptions.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px] h-10 bg-white border-slate-200 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 text-slate-700">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-3 text-slate-500 hover:text-slate-900">
                Clear ({activeFilters})
              </Button>
            )}
          </div>
        </div>

        {data.length === 0 ? (
          /* Empty state (no employees at all) */
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#22BFE8]/15 to-[#1A6DB6]/10 flex items-center justify-center mb-4 ring-1 ring-[#22BFE8]/20">
              <Inbox className="h-7 w-7 text-[#1A6DB6]" />
            </div>
            <h3 className="font-semibold text-slate-900 text-lg">No employees yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              Start building your team by adding your first employee. They’ll receive system access automatically.
            </p>
            <Button
              size="sm"
              className="mt-5 gap-2 shadow-sm shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold"
              onClick={() => setIsSheetOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          /* No results for filters */
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 ring-1 ring-slate-200">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900">No matching employees</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              Try adjusting your filters or search terms.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          /* Data Table */
          <div className={cn(isPending && "opacity-60 pointer-events-none transition-opacity")}>
            <DataTable
              columns={columns}
              data={filtered}
              isLoading={false}
              onRefresh={() => startTransition(() => router.refresh())}
            />
          </div>
        )}
      </div>

      {/* Credential dialog — safely rendered at the page root, outside of any Sheets */}
      <CredentialDialog
        open={credentialDialog.open}
        onClose={() => {
          setCredentialDialog(prev => ({ ...prev, open: false }))
          startTransition(() => router.refresh())
        }}
        employeeName={credentialDialog.employeeName}
        email={credentialDialog.email}
        tempPassword={credentialDialog.tempPassword}
      />
    </div>
  )
}
