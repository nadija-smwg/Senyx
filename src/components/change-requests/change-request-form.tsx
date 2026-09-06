"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

interface ChangeRequestFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function ChangeRequestForm({ onSuccess, onCancel }: ChangeRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<{title?: string; description?: string}>({})

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (title.length > 160) newErrors.title = "Title is too long (max 160 characters)"
    if (!description.trim()) newErrors.description = "Description is required"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit request")
      }

      toast.success(data.message || "Change request submitted successfully.")
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-5">
      <div className="space-y-4 flex-1">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Request Title <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="E.g., Need access to GitHub repository"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white border-slate-200"
          />
          {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Description <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Please describe your request in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[200px] resize-none bg-white border-slate-200"
          />
          {errors.description && <p className="text-xs text-rose-500">{errors.description}</p>}
          <p className="text-[11px] text-slate-400">
            Explain the request in your own words. It will be reviewed by an administrator.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4 mr-2" /> : null}
          Submit Request
        </Button>
      </div>
    </form>
  )
}
