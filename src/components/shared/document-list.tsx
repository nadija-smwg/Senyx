"use client"

import { useState, useEffect } from "react"
import { FileUpload } from "./file-upload"
import { FileText, Download, Trash2, Calendar, FileType2, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { format } from "date-fns"

interface Document {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  uploadedBy: string
}

interface DocumentListProps {
  ownerType: string
  ownerId: string
  title?: string
  description?: string
}

export function DocumentList({ ownerType, ownerId, title = "Documents", description = "Manage uploaded files and assets." }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true)
        const res = await fetch(`/api/documents?ownerType=${ownerType}&ownerId=${ownerId}`)
        const data = await res.json()
        if (data.success) {
          setDocuments(data.data)
        }
      } catch (err) {
        console.error("Failed to fetch documents", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [ownerType, ownerId])

  const handleUploadComplete = (newDoc: Document) => {
    setDocuments(prev => [newDoc, ...prev])
  }

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`)
      const data = await res.json()
      if (data.url) {
        const a = document.createElement('a')
        a.href = data.url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error("Failed to download", err)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (err) {
      console.error("Failed to delete", err)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Upload Section */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
          <h3 className="text-lg font-heading font-bold text-slate-800 mb-4">Upload</h3>
          <FileUpload 
            ownerType={ownerType} 
            ownerId={ownerId} 
            onUploadComplete={handleUploadComplete} 
            maxSizeMB={10} 
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-heading font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
          
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileType2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 line-clamp-1" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                      <div className="flex items-center text-xs text-slate-500 mt-1 space-x-3">
                        <span>{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(doc.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600" onClick={() => handleDownload(doc.id, doc.fileName)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
