"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

type Designation = { id: string; title: string; level: number; annualLeaveDays: string }

export default function DesignationsPage() {
  const [data, setData] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null)
  const [editDays, setEditDays] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const fetchDesignations = () => {
    setLoading(true)
    fetch("/api/designations")
      .then(res => res.json())
      .then(json => setData(json.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDesignations()
  }, [])

  const handleSave = async () => {
    if (!editingDesig) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/designations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingDesig.id, annualLeaveDays: editDays })
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Leave days updated successfully")
      setEditingDesig(null)
      fetchDesignations()
    } catch (error) {
      toast.error("Error updating leave days")
    } finally {
      setIsSaving(false)
    }
  }

  const columns: ColumnDef<Designation>[] = [
    { accessorKey: "title", header: "Job Title" },
    { accessorKey: "level", header: "Level" },
    { accessorKey: "annualLeaveDays", header: "Annual Leave Days" },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button variant="ghost" size="icon" onClick={() => {
            setEditingDesig(row.original)
            setEditDays(row.original.annualLeaveDays || "30.00")
          }}>
            <Pencil className="h-4 w-4" />
          </Button>
        )
      }
    }
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader title="Designations" description="Manage job titles and leave allocations." />
      <DataTable columns={columns} data={data} searchKey="title" isLoading={loading} />

      <Dialog open={!!editingDesig} onOpenChange={(o) => !o && setEditingDesig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Leave Days for {editingDesig?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="days" className="text-right">Days</Label>
              <Input
                id="days"
                type="number"
                step="0.5"
                className="col-span-3"
                value={editDays}
                onChange={(e) => setEditDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDesig(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
