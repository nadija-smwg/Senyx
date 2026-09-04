import * as React from "react"
import { cn } from "../../lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: "positive" | "negative" | "warning" | "neutral" | "info";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, status, ...props }, ref) => (
  <div ref={ref} className={cn(
    "rounded-[14px] bg-white text-card-foreground border border-[#E5E7EB] transition-shadow duration-200",
    "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
    "hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)]",
    status === "positive" && "border-t-2 border-t-emerald-500",
    status === "negative" && "border-t-2 border-t-red-500",
    status === "warning" && "border-t-2 border-t-amber-500",
    status === "neutral" && "border-t-2 border-t-slate-400",
    status === "info" && "border-t-2 border-t-[#22BFE8]",
    className
  )} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1 p-5", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-semibold leading-tight tracking-tight text-gray-900 text-[15px]", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-gray-500", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
