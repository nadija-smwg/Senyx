"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data/data-table"
import { ColumnDef } from "@tanstack/react-table"

type Designation = { id: string; title: string; level: number }

const columns: ColumnDef<Designation>[] = [
  { accessorKey: "title", header: "Job Title" },
  { accessorKey: "level", header: "Level" },
]

export default function DesignationsPage() {
  const [data, setData] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/designations")
      .then(res => res.json())
      .then(json => setData(json.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader title="Designations" description="Manage job titles and levels." />
      <DataTable columns={columns} data={data} searchKey="title" isLoading={loading} />
    </div>
  )
}
