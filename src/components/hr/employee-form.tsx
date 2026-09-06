"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { ContextualHelp } from "@/components/ui/contextual-help"
import { toast } from "sonner"
import {
  ShieldCheck,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  Mail,
  Phone,
  IdCard,
  Wallet,
  KeyRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { CredentialDialog } from "@/components/hr/credential-dialog"
import { cn } from "@/lib/utils"

// ── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  designationId: z.string().min(1, "Designation is required"),
  departmentId: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  startDate: z.string().min(1, "Start date is required"),
  salary: z.string().optional(),
  nationalId: z.string().optional(),
  roleId: z.string().optional(),
  // No password fields — generated server-side
})

const editSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  designationId: z.string().min(1, "Designation is required"),
  departmentId: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  startDate: z.string().min(1, "Start date is required"),
  salary: z.string().optional(),
  nationalId: z.string().optional(),
})

// ── Types ─────────────────────────────────────────────────────────────────────

type CreateFormValues = z.infer<typeof createSchema>
type EditFormValues = z.infer<typeof editSchema>

interface EmployeeFormProps {
  initialData?: EditFormValues & { id?: string }
  onSuccess?: (result?: any) => void
  onCancel?: () => void
}

// ── Section Header helper ────────────────────────────────────────────────────

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[#22BFE8]/15 to-[#1A6DB6]/10 flex items-center justify-center ring-1 ring-[#22BFE8]/20">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [referenceError, setReferenceError] = useState<string | null>(null)

  const isEdit = !!initialData?.id

  const schema = isEdit ? editSchema : createSchema

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: isEdit
      ? (initialData as any)
      : {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        employmentType: "full_time",
        startDate: new Date().toISOString().split('T')[0],
        salary: "",
        nationalId: "",
        roleId: "",
      },
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then(res => res.json()),
      fetch("/api/designations").then(res => res.json()),
      fetch("/api/roles").then(res => res.json()),
    ]).then(([deps, desigs, rolesData]) => {
      setDepartments(deps.data || [])
      setDesignations(desigs.data || [])
      setRoles(rolesData.data || [])
    }).catch(() => {
      // Departments / designations / roles may fail silently — handled below
    })
  }, [])

  async function onSubmit(values: CreateFormValues) {
    setReferenceError(null)
    try {
      setIsSubmitting(true)
      const endpoint = isEdit ? `/api/employees/${initialData!.id}` : "/api/employees"
      const method = isEdit ? "PATCH" : "POST"

      // Clean up empty string values for optional UUID fields to prevent Zod .uuid() validation errors
      const payload = { ...values } as any
      if (!payload.roleId) delete payload.roleId
      if (!payload.departmentId) delete payload.departmentId
      if (isEdit) delete payload.roleId

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        const msg = errorData.error?.message || `Failed to ${isEdit ? 'update' : 'create'} employee`
        setReferenceError(msg)
        throw new Error(msg)
      }

      const result = await res.json()

      if (isEdit) {
        toast.success(result.message || 'Employee updated successfully', {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        })
      }
      
      if (onSuccess) {
        onSuccess(result)
      } else {
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", {
        icon: <AlertCircle className="h-4 w-4 text-rose-600" />,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="flex flex-col">

        <div className="space-y-7">

          {/* ── Top-level error banner ──────────────────────────────────────── */}
          {referenceError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="font-medium">{referenceError}</p>
            </div>
          )}

          {/* ── Personal Information ──────────────────────────────────────── */}
          <section className="space-y-4">
            <SectionHeader
              icon={<User className="h-4 w-4 text-[#1A6DB6]" />}
              title="Personal Information"
              description="Basic identifying details for the employee."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      First Name <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      Last Name <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-400" />
                    Work Email <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@company.com"
                      disabled={isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* ── Employment ───────────────────────────────────────────────── */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Briefcase className="h-4 w-4 text-[#1A6DB6]" />}
              title="Employment"
              description="Role, department and contract details."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      Employment Type <span className="text-rose-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Start Date <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    Department
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="designationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    Designation <span className="text-rose-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a designation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* ── Role & Login Access (create only) ──────────────────────────── */}
          {!isEdit && (
            <section className="space-y-4 pt-5 border-t border-slate-100">
              <SectionHeader
                icon={<ShieldCheck className="h-4 w-4 text-[#1A6DB6]" />}
                title="Role & Login Access"
                description="Provision system access for this employee."
              />

              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-cyan-50/40 p-3.5">
                <div className="flex items-start gap-2.5">
                  <KeyRound className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-xs leading-relaxed text-blue-800">
                    <strong className="font-semibold">Login credentials will be generated automatically.</strong>
                    <br />
                    A secure temporary password will be created for this employee. They will be
                    required to set a new permanent password when signing in for the first time.
                  </div>
                </div>
              </div>

              <FormField
                control={form.control as any}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Employee (default)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center gap-2">
                              {r.name}
                              {r.isSystem && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 border-blue-200 text-blue-600">
                                  System
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Defaults to &ldquo;Employee&rdquo; if not selected.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
          )}

          {/* ── Sensitive Information ──────────────────────────────────────── */}
          <section className="space-y-4 pt-5 border-t border-slate-100">
            <SectionHeader
              icon={<Wallet className="h-4 w-4 text-[#1A6DB6]" />}
              title="Compensation & Records"
              description="Confidential payroll information (encrypted at rest)."
            />

            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel className="flex items-center gap-1.5">
                      Annual Salary (USD)
                    </FormLabel>
                    <ContextualHelp tooltip="Enter the base annual salary in USD. Leave blank for hourly workers." href="/help/human-resources" />
                  </div>
                  <FormControl>
                    <Input type="number" placeholder="60000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <IdCard className="h-3 w-3 text-slate-400" />
                    National ID / SSN
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="XXX-XX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        </div>

        {/* ── Sticky Action Bar ───────────────────────────────────────────── */}
        <div className="sticky bottom-0 -mx-6 mt-8 px-6 py-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "gap-2 shadow-sm shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold transition-all",
                isSubmitting && "opacity-90"
              )}
            >
              {isSubmitting && <Spinner className="h-3.5 w-3.5" />}
              {isSubmitting
                ? (isEdit ? "Updating..." : "Creating employee...")
                : (isEdit ? "Update Employee" : "Create Employee & Grant Access")}
            </Button>
          </div>
        </div>
        </form>
      </Form>
    </>
  )
}
