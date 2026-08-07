"use client"

import { useEffect, useState } from "react"
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
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Designations</h1>
        <p className="text-muted-foreground">Manage job titles and levels.</p>
      </div>
      <DataTable columns={columns} data={data} searchKey="title" isLoading={loading} />
    </div>
  )
}
