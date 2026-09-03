"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { ContextualHelp } from "@/components/ui/contextual-help"
import { toast } from "sonner"
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react"

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
  initialPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm the password"),
}).refine(data => data.initialPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
  onSuccess?: () => void
  onCancel?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
          initialPassword: "",
          confirmPassword: "",
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
    try {
      setIsSubmitting(true)
      const endpoint = isEdit ? `/api/employees/${initialData!.id}` : "/api/employees"
      const method = isEdit ? "PATCH" : "POST"

      // For edit, strip auth-only fields
      const payload = isEdit
        ? (() => {
            const { initialPassword, confirmPassword, roleId, ...rest } = values as any
            return rest
          })()
        : values

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || `Failed to ${isEdit ? 'update' : 'create'} employee`)
      }

      const result = await res.json()
      const msg = result.message || `Employee ${isEdit ? 'updated' : 'created'} successfully`
      toast.success(msg)

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">

        {/* ── Personal Info ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
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
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Work Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@company.com" disabled={isEdit} {...field} />
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type *</FormLabel>
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
            name="departmentId"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Department</FormLabel>
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
              <FormItem className="md:col-span-2">
                <FormLabel>Designation *</FormLabel>
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

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Role & Access (create only) ────────────────────────────────── */}
        {!isEdit && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-[#1A6DB6]" />
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Role & Login Access
              </h3>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 mb-5">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>A login account will be created automatically</strong> for this employee using the email and password below.
                The employee can log in immediately and change their password using the "Forgot password?" link.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control as any}
                name="roleId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
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
                      Defaults to "Employee" if not selected.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="initialPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" />
                      Temporary Password *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* ── Sensitive Information ──────────────────────────────────────── */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Sensitive Information
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Annual Salary (USD)</FormLabel>
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
                  <FormLabel>National ID / SSN</FormLabel>
                  <FormControl>
                    <Input placeholder="XXX-XX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (isEdit ? "Updating..." : "Creating employee...")
              : (isEdit ? "Update Employee" : "Create Employee & Grant Access")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
