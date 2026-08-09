"use client";

import { useState, useEffect } from 'react';
import { FilterBuilder, FilterGroup } from '@/components/data/filter-builder';
import { SavedFilters } from '@/components/data/saved-filters';
import { BarChartWidget } from '@/components/charts/bar-chart-widget';
import { LineChartWidget } from '@/components/charts/line-chart-widget';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TABS = ['Sales', 'Projects', 'Finance', 'HR', 'Activity'];

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<string>(TABS[0] as string);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({ logic: 'AND', rules: [] });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getBackendModule = (tab: string) => {
    switch (tab) {
      case 'Sales': return 'deals';
      case 'Finance': return 'invoices';
      case 'HR': return 'employees';
      case 'Activity': return 'tasks';
      default: return 'projects';
    }
  };

  const fetchAnalytics = async (module: string, group: FilterGroup) => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: getBackendModule(module), filters: group })
      });
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const emptyGroup: FilterGroup = { logic: 'AND', rules: [] };
    setFilterGroup(emptyGroup);
    fetchAnalytics(activeTab, emptyGroup);
  }, [activeTab]);

  const handleApplyFilter = (group: FilterGroup) => {
    setFilterGroup(group);
    fetchAnalytics(activeTab, group);
  };

  const getFieldsForModule = () => {
    if (activeTab === 'Sales') return [
      { label: 'Stage', value: 'stage', type: 'select' as const, options: [{label: 'Lead', value: 'lead'}, {label: 'Qualified', value: 'qualified'}, {label: 'Proposal', value: 'proposal'}, {label: 'Negotiation', value: 'negotiation'}] }, 
      { label: 'Status', value: 'status', type: 'select' as const, options: [{label: 'Open', value: 'open'}, {label: 'Won', value: 'won'}, {label: 'Lost', value: 'lost'}] },
      { label: 'Amount', value: 'amount', type: 'text' as const }
    ];
    if (activeTab === 'Finance') return [
      { label: 'Status', value: 'status', type: 'select' as const, options: [{label: 'Draft', value: 'draft'}, {label: 'Sent', value: 'sent'}, {label: 'Paid', value: 'paid'}, {label: 'Overdue', value: 'overdue'}] }, 
      { label: 'Issue Date', value: 'issueDate', type: 'date' as const }
    ];
    if (activeTab === 'Projects') return [
      { label: 'Status', value: 'status', type: 'select' as const, options: [{label: 'Planning', value: 'planning'}, {label: 'Active', value: 'active'}, {label: 'On Hold', value: 'on hold'}, {label: 'Completed', value: 'completed'}] }
    ];
    if (activeTab === 'HR') return [
      { label: 'Status', value: 'status', type: 'select' as const, options: [{label: 'Active', value: 'active'}, {label: 'On Leave', value: 'on_leave'}, {label: 'Terminated', value: 'terminated'}] }
    ];
    if (activeTab === 'Activity') return [
      { label: 'Status', value: 'status', type: 'select' as const, options: [{label: 'Todo', value: 'todo'}, {label: 'In Progress', value: 'in_progress'}, {label: 'Review', value: 'review'}, {label: 'Completed', value: 'completed'}] }
    ];
    return [{ label: 'Keyword', value: 'keyword', type: 'text' as const }];
  };

  const renderDataGrid = () => {
    if (!data || data.length === 0) return <p className="text-gray-500 text-sm">No records found.</p>;
    
    let columns: {key: string, label: string}[] = [];
    if (activeTab === 'Sales') {
      columns = [
        {key: 'name', label: 'Deal Name'},
        {key: 'amount', label: 'Amount'},
        {key: 'currency', label: 'Currency'},
        {key: 'stage', label: 'Stage'},
        {key: 'status', label: 'Status'}
      ];
    } else if (activeTab === 'Finance') {
      columns = [
        {key: 'invoiceNumber', label: 'Invoice #'},
        {key: 'subtotal', label: 'Subtotal'},
        {key: 'total', label: 'Total'},
        {key: 'status', label: 'Status'},
        {key: 'issueDate', label: 'Issue Date'}
      ];
    } else if (activeTab === 'HR') {
       columns = [
        {key: 'firstName', label: 'First Name'},
        {key: 'lastName', label: 'Last Name'},
        {key: 'email', label: 'Email'},
        {key: 'status', label: 'Status'}
      ];
    } else if (activeTab === 'Projects') {
       columns = [
        {key: 'code', label: 'Code'},
        {key: 'name', label: 'Project Name'},
        {key: 'status', label: 'Status'},
        {key: 'budget', label: 'Budget'}
      ];
    } else if (activeTab === 'Activity') {
       columns = [
        {key: 'title', label: 'Title'},
        {key: 'priority', label: 'Priority'},
        {key: 'status', label: 'Status'}
      ];
    } else {
      const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object').slice(0, 5);
      columns = keys.map(k => ({key: k, label: k}));
    }

    return (
      <div className="rounded-md border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(c => <TableHead key={c.key}>{c.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any, i: number) => (
              <TableRow key={row.id || i}>
                {columns.map(c => (
                  <TableCell key={c.key}>{row[c.key]?.toString() || '-'}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Advanced Analytics</h1>
          <p className="text-gray-500 mt-1">Deep dive into your modules with custom filtering.</p>
        </div>
        <div className="flex items-center gap-3">
          <SavedFilters currentGroup={filterGroup} onLoad={handleApplyFilter} />
          <FilterBuilder fields={getFieldsForModule()} onApply={handleApplyFilter} onClear={() => handleApplyFilter({ logic: 'AND', rules: [] })} />
        </div>
      </div>

      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {/* Dynamic Content based on activeTab */}
          {activeTab === 'Sales' && data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl border border-gray-100 col-span-full shadow-sm">
                 <h3 className="font-semibold text-gray-900 mb-2">Query Results</h3>
                 <p className="text-gray-500 text-sm mb-6">Returned {data?.length || 0} records for {activeTab}</p>
                 {renderDataGrid()}
               </div>
            </div>
          )}
          {activeTab !== 'Sales' && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Query Results</h3>
              <p className="text-gray-500 text-sm mb-6">Returned {data?.length || 0} records for {activeTab}</p>
              {renderDataGrid()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
