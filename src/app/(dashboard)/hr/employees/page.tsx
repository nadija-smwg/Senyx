"use client"

import { useEffect, useState, useCallback } from "react"
import { columns, Employee } from "./columns"
import { DataTable } from "@/components/data/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { EmployeeForm } from "@/components/hr/employee-form"
import { PageHeader } from "@/components/layout/page-header"

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/employees")
      if (!response.ok) throw new Error("Failed to fetch employees")
      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header Section */}
      <PageHeader 
        pretitle="HR & People"
        title="Employees"
        description="Manage your organization's employee directory. View roles, update details, and add new team members."
        actions={
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="default" className="shrink-0 gap-2 shadow-lg shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold transition-all hover:scale-105">
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-6">
              <SheetHeader className="mb-6 p-0">
                <SheetTitle className="text-2xl font-bold font-heading">Add New Employee</SheetTitle>
              </SheetHeader>
              <EmployeeForm 
                onSuccess={() => {
                  setIsSheetOpen(false)
                  fetchData()
                }}
                onCancel={() => setIsSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
        }
      />

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          searchKey="firstName"
          searchPlaceholder="Search employees by name..."
          isLoading={loading}
          onRefresh={fetchData}
        />
      </div>
    </div>
  )
}

