import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-indigo-50 text-indigo-700 border border-indigo-200",
        secondary:   "bg-gray-100 text-gray-600 border border-gray-200",
        destructive: "bg-red-50 text-red-700 border border-red-200",
        outline:     "text-gray-600 border border-gray-200",
        positive:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning:     "bg-amber-50 text-amber-700 border border-amber-200",
        negative:    "bg-red-50 text-red-700 border border-red-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
