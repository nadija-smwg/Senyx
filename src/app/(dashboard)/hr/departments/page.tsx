"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data/data-table"
import { ColumnDef } from "@tanstack/react-table"

type Department = { id: string; name: string; description: string | null }

const columns: ColumnDef<Department>[] = [
  { accessorKey: "name", header: "Department Name" },
  { accessorKey: "description", header: "Description" },
]

export default function DepartmentsPage() {
  const [data, setData] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/departments")
      .then(res => res.json())
      .then(json => setData(json.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader title="Departments" description="Manage organization departments." />
      <DataTable columns={columns} data={data} searchKey="name" isLoading={loading} />
    </div>
  )
}
