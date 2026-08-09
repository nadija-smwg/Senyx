"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { format } from "date-fns"
import { Clock, Activity, Database, CheckCircle2, XCircle } from "lucide-react"
import { AuditLog } from "../../columns"

export default function UserTimelinePage(props: { params: Promise<{ userId: string }> }) {
  const params = use(props.params)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    // In a real implementation this would fetch from /api/audit-logs?actorId=...
    Promise.resolve().then(() => setLoading(true));
    setTimeout(() => {
      setLogs([
        {
          id: '1',
          action: 'Created Deal',
          entityType: 'deals',
          entityId: 'deal-123',
          createdAt: new Date().toISOString(),
          actorId: params.userId,
          apiRoute: 'POST /api/deals',
          ipAddress: '192.168.1.1',
          device: 'Desktop',
          os: 'Mac OS',
          browser: 'Chrome',
          result: 'success',
          after: { name: 'Acme Corp Deal', value: 50000 }
        },
        {
          id: '2',
          action: 'Updated Profile',
          entityType: 'users',
          entityId: params.userId,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          actorId: params.userId,
          apiRoute: 'PUT /api/users/me',
          ipAddress: '192.168.1.1',
          device: 'Desktop',
          os: 'Mac OS',
          browser: 'Chrome',
          result: 'success',
          before: { phone: '123' }, 
          after: { phone: '456' }
        },
        {
          id: '3',
          action: 'Failed Login',
          entityType: 'auth',
          entityId: params.userId,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          actorId: params.userId,
          apiRoute: 'POST /api/auth/login',
          ipAddress: '10.0.0.1',
          device: 'Mobile',
          os: 'Unknown',
          browser: 'Unknown',
          result: 'failure'
        }
      ])
      setLoading(false)
    }, 500)
  }, [params.userId])

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900">User Timeline</h1>
        <p className="text-slate-500 mt-1">
          Chronological activity feed for User ID: <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded text-sm">{params.userId}</span>
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        {loading ? (
          <div className="flex justify-center text-slate-500 py-10">Loading timeline...</div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-8">
                <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white ${log.result === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider flex items-center">
                      <Database className="w-3 h-3 mr-1 opacity-50" /> {log.entityType}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-slate-400 mt-1 sm:mt-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                  </div>
                </div>

                {/* Status & Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <span className="flex items-center">
                    {log.result === 'success' ? (
                      <><CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1" /> Success</>
                    ) : (
                      <><XCircle className="w-3 h-3 text-rose-500 mr-1" /> Failed</>
                    )}
                  </span>
                  <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    {log.apiRoute}
                  </span>
                </div>

                {/* Diff View */}
                {(log.before || log.after) && (
                  <div className="mt-4 flex flex-col md:flex-row gap-3">
                    {log.before && (
                      <div className="flex-1 bg-rose-50/50 p-3 rounded-xl border border-rose-100/50">
                        <h4 className="text-[10px] font-bold text-rose-600 mb-1.5 uppercase tracking-wider">Before</h4>
                        <pre className="text-[10px] font-mono text-slate-700 whitespace-pre-wrap">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div className="flex-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                        <h4 className="text-[10px] font-bold text-emerald-600 mb-1.5 uppercase tracking-wider">After</h4>
                        <pre className="text-[10px] font-mono text-slate-700 whitespace-pre-wrap">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
