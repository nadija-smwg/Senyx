"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

interface CredentialDialogProps {
  open: boolean
  onClose: () => void
  employeeName: string
  email: string
  tempPassword: string
}

export function CredentialDialog({
  open,
  onClose,
  employeeName,
  email,
  tempPassword,
}: CredentialDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      toast.success("Password copied to clipboard", {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      })
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error("Failed to copy password")
    }
  }

  const maskedPassword = tempPassword.replace(/./g, "•")

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">Employee Created Successfully</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Login credentials have been generated
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Employee info */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Name</span>
              <span className="text-sm font-medium text-gray-900">{employeeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Email / Login</span>
              <span className="text-sm font-medium text-gray-900">{email}</span>
            </div>
          </div>

          {/* Temporary password */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Temporary Password
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className={cn(
                "flex-1 text-base font-mono font-bold px-3 py-2 rounded-lg bg-white border border-blue-100",
                showPassword ? "text-gray-900 tracking-wide" : "text-gray-500"
              )}>
                {showPassword ? tempPassword : maskedPassword}
              </code>
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "p-2 rounded-lg border transition-all",
                  copied
                    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                    : "text-gray-400 hover:text-gray-700 hover:bg-white border-transparent hover:border-gray-200"
                )}
                aria-label="Copy password"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong>This password will only be shown once.</strong> Ask the employee to use it
              when signing in for the first time. They will be required to set a new permanent
              password before accessing the system.
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
