"use client";

import { useState } from 'react';
import { FileText, Download, FileSpreadsheet, ChevronRight, X } from 'lucide-react';
import { PipelineFunnel } from '@/components/charts/pipeline-funnel';
import { AgingChart } from '@/components/charts/aging-chart';

const REPORTS = [
  { id: 'project-profitability', name: 'Project Profitability', desc: 'Revenue, costs, and net margin per project.' },
  { id: 'contribution', name: 'Employee Contribution', desc: 'Billable and non-billable hours logged per employee per project.' },
  { id: 'sales-pipeline', name: 'Sales Pipeline Snapshot', desc: 'Open deals grouped by stage and forecasted by expected close date.' },
  { id: 'sales-by-person', name: 'Sales by Person', desc: 'Win rates, deal values, and commission attribution by sales rep.' },
  { id: 'milestone-collection', name: 'Milestone Collections', desc: 'Detailed status of payment milestones and totals due.' },
  { id: 'financial-summary', name: 'Financial Summary', desc: 'High-level P&L view breaking down revenue sources and expense categories.' },
  { id: 'receivables-aging', name: 'Receivables Aging', desc: 'Outstanding invoices grouped by client and 30-day aging buckets.' }
];

export default function ReportsHub() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async (id: string) => {
    setActiveReport(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const json = await res.json();
      setReportData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closeReport = () => {
    setActiveReport(null);
    setReportData(null);
  };

  const downloadReport = (format: 'pdf' | 'csv') => {
    if (!activeReport) return;
    window.location.href = `/api/reports/${activeReport}?format=${format}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      
      {!activeReport ? (
        <div className="animate-in fade-in duration-300">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Report Hub</h1>
            <p className="text-gray-500 mt-1">Generate, view, and export standard business reports.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPORTS.map((report) => (
              <div 
                key={report.id}
                onClick={() => loadReport(report.id)}
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{report.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-4 duration-300 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
            <div>
              <button onClick={closeReport} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center mb-2">
                ← Back to Hub
              </button>
              <h2 className="text-2xl font-bold text-gray-900">{REPORTS.find(r => r.id === activeReport)?.name}</h2>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => downloadReport('csv')}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Export CSV
              </button>
              <button 
                onClick={() => downloadReport('pdf')}
                className="flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : reportData ? (
              <div className="space-y-8">
                {/* Specific chart renderings if applicable */}
                {activeReport === 'sales-pipeline' && reportData.pipeline && (
                  <PipelineFunnel 
                    title="Pipeline Funnel"
                    data={reportData.pipeline}
                    nameKey="Deal Name"
                    dataKey="Amount"
                  />
                )}

                {activeReport === 'receivables-aging' && Array.isArray(reportData) && (
                  <AgingChart 
                    title="Aging Visualization"
                    data={reportData.map((d: any) => ({
                      'Account Name': d['Account Name'],
                      'Current': Number(d['Current']),
                      '1-30 Days': Number(d['1-30 Days']),
                      '31-60 Days': Number(d['31-60 Days']),
                      '61-90 Days': Number(d['61-90 Days']),
                      '90+ Days': Number(d['90+ Days']),
                    }))}
                  />
                )}

                {/* Generic JSON dump for MVP Data Table */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Raw Report Data</h4>
                  <pre className="text-xs text-gray-700">{JSON.stringify(reportData, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-20">No data found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
