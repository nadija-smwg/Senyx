import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-all outline-none",
        "focus:border-[#22BFE8] focus:ring-2 focus:ring-[#22BFE8]/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
