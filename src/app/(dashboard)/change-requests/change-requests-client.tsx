"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { columns, ChangeRequest } from "./columns"
import { DataTable } from "@/components/data/data-table"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Inbox, FileEdit } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ChangeRequestForm } from "@/components/change-requests/change-request-form"
import { cn } from "@/lib/utils"

export function ChangeRequestsClient({ initialData, isAdmin, employeeId }: { initialData: any[], isAdmin: boolean, employeeId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Map the raw data to the shape expected by columns
  const data: ChangeRequest[] = initialData.map(d => ({
    ...d,
    isAdmin
  }))

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[180%] rounded-[100%] bg-gradient-to-br from-[#3B3B3B]/10 via-[#7F4D9F]/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative px-6 py-5 md:px-7 md:py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-500">
              System
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold font-heading text-gray-900 tracking-tight">
              {isAdmin ? "Change Requests" : "My Change Requests"}
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
              {isAdmin 
                ? "Review and manage employee requests." 
                : "Submit a request and track its status."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-slate-600 shadow-sm bg-white"
              onClick={() => startTransition(() => router.refresh())}
              disabled={isPending}
            >
              <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
              Refresh
            </Button>
            
            {!isAdmin && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-2 shadow-sm shadow-slate-800/20 bg-slate-900 hover:bg-slate-800 border-0 text-white font-semibold transition-all hover:scale-[1.02]"
                  >
                    <Plus className="h-4 w-4" />
                    New Change Request
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-[520px] flex flex-col p-0">
                  <SheetHeader className="p-6 pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-slate-500">
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>New Request</span>
                    </div>
                    <SheetTitle className="text-2xl font-bold font-heading mt-1">Submit Change Request</SheetTitle>
                    <SheetDescription>
                      Provide a short title and describe your request in detail.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-6 py-4 relative h-full">
                    <ChangeRequestForm
                      onSuccess={() => {
                        setIsSheetOpen(false)
                        startTransition(() => router.refresh())
                      }}
                      onCancel={() => setIsSheetOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 ring-1 ring-slate-200">
              <Inbox className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 text-lg">No requests found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              {isAdmin ? "There are no employee change requests at the moment." : "You haven't submitted any change requests yet."}
            </p>
          </div>
        ) : (
          <div className={cn(isPending && "opacity-60 pointer-events-none transition-opacity")}>
            <DataTable
              columns={columns}
              data={data}
              isLoading={false}
              onRefresh={() => startTransition(() => router.refresh())}
            />
          </div>
        )}
      </div>
    </div>
  )
}
