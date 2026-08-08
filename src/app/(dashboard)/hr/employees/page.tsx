"use client"

import { useEffect, useState } from "react"
import { columns, Employee } from "./columns"
import { DataTable } from "@/components/data/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/employees")
        if (!response.ok) throw new Error("Failed to fetch employees")
        const result = await response.json()
        setData(result.data || [])
      } catch (error) {
        console.error("Error fetching employees:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-slate-900">
            Employees
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base max-w-xl">
            Manage your organization's employee directory. View roles, update details, and add new team members.
          </p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95 rounded-xl px-6 h-11 shrink-0">
          <Link href="/hr/employees/new">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Link>
        </Button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          searchKey="firstName"
          searchPlaceholder="Search employees by name..."
          isLoading={loading}
        />
      </div>
    </div>
  )
}
