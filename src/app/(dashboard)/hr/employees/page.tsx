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
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your organization's employee directory.
          </p>
        </div>
        <Button asChild>
          <Link href="/hr/employees/new">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="firstName"
        searchPlaceholder="Search employees by name..."
        isLoading={loading}
      />
    </div>
  )
}
