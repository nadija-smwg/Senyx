"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChangeRequest } from "@/app/(dashboard)/change-requests/columns"

interface ChangeRequestAdminFormProps {
  request: ChangeRequest
  onSuccess: () => void
  onCancel: () => void
}

export function ChangeRequestAdminForm({ request, onSuccess, onCancel }: ChangeRequestAdminFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState(request.status)
  const [adminComment, setAdminComment] = useState(request.adminComment || "")
  const [errors, setErrors] = useState<{status?: string}>({})

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!status) newErrors.status = "Status is required"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/change-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminComment }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update request")
      }

      toast.success(data.message || "Change request updated successfully.")
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-5">
      <div className="space-y-5 flex-1">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
           <h3 className="text-sm font-bold text-slate-900">{request.title}</h3>
           <p className="text-sm text-slate-600 whitespace-pre-wrap">{request.description}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Request Status <span className="text-rose-500">*</span>
          </Label>
          <Select value={status} onValueChange={(val: any) => setStatus(val)}>
            <SelectTrigger className="w-full bg-white border-slate-200">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-rose-500">{errors.status}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="adminComment" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Admin Response
          </Label>
          <Textarea
            id="adminComment"
            placeholder="Provide a response or resolution notes..."
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            className="min-h-[120px] resize-none bg-white border-slate-200"
          />
          <p className="text-[11px] text-slate-400">
            This comment will be visible to the employee who submitted the request.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4 mr-2" /> : null}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
