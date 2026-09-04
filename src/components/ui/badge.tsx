import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        // Brand default = Senyx cyan/blue (no indigo)
        default: "bg-[#E6F4FB] text-[#1A6DB6] border border-[#BFE3F2]",
        secondary: "bg-gray-100 text-gray-700 border border-gray-200",
        destructive: "bg-red-50 text-[#C1172C] border border-red-200",
        outline: "text-gray-700 border border-[#E5E7EB] bg-white",
        positive: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        negative: "bg-red-50 text-[#C1172C] border border-red-200",
        neutral: "bg-slate-50 text-slate-700 border border-slate-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
