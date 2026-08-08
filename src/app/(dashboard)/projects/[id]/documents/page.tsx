"use client"

import { use } from "react"
import { DocumentList } from "@/components/shared/document-list"

export default function ProjectDocumentsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const projectId = params.id

  return (
    <div className="space-y-6">
      <DocumentList 
        ownerType="project" 
        ownerId={projectId} 
        title="Project Documents" 
        description="Manage files and assets for this project." 
      />
    </div>
  )
}
