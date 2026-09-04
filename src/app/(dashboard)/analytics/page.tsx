"use client";

import { useState, useEffect } from 'react';
import { FilterBuilder, FilterGroup } from '@/components/data/filter-builder';
import { SavedFilters } from '@/components/data/saved-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState, EmptyState, SectionTitle } from '@/components/shared/page-states';

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
    Promise.resolve().then(() => setLoading(true));
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
    // Initial fetch on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics(activeTab, filterGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const emptyGroup: FilterGroup = { logic: 'AND', rules: [] };
    setFilterGroup(emptyGroup);
    fetchAnalytics(tab, emptyGroup);
  };

  const handleApplyFilter = (group: FilterGroup) => {
    setFilterGroup(group);
    fetchAnalytics(activeTab, group);
  };

  const getFieldsForModule = () => {
    if (activeTab === 'Sales') return [
      { label: 'Stage', value: 'stage', type: 'select' as const, options: [{ label: 'Lead', value: 'lead' }, { label: 'Qualified', value: 'qualified' }, { label: 'Proposal', value: 'proposal' }, { label: 'Negotiation', value: 'negotiation' }] },
      { label: 'Status', value: 'status', type: 'select' as const, options: [{ label: 'Open', value: 'open' }, { label: 'Won', value: 'won' }, { label: 'Lost', value: 'lost' }] },
      { label: 'Amount', value: 'amount', type: 'text' as const }
    ];
    if (activeTab === 'Finance') return [
      { label: 'Status', value: 'status', type: 'select' as const, options: [{ label: 'Draft', value: 'draft' }, { label: 'Sent', value: 'sent' }, { label: 'Paid', value: 'paid' }, { label: 'Overdue', value: 'overdue' }] },
      { label: 'Issue Date', value: 'issueDate', type: 'date' as const }
    ];
    if (activeTab === 'Projects') return [
      { label: 'Status', value: 'status', type: 'select' as const, options: [{ label: 'Planning', value: 'planning' }, { label: 'Active', value: 'active' }, { label: 'On Hold', value: 'on hold' }, { label: 'Completed', value: 'completed' }] }
    ];
    if (activeTab === 'HR') return [
      { label: 'Status', value: 'status', type: 'select' as const, options: [{ label: 'Active', value: 'active' }, { label: 'On Leave', value: 'on_leave' }, { label: 'Terminated', value: 'terminated' }] }
    ];
    if (activeTab === 'Activity') return [
      { label: 'Status', value: 'status', type: 'select' as const, options: [{ label: 'Todo', value: 'todo' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Review', value: 'review' }, { label: 'Completed', value: 'completed' }] }
    ];
    return [{ label: 'Keyword', value: 'keyword', type: 'text' as const }];
  };

  const renderDataGrid = () => {
    if (!data || data.length === 0) {
      return (
        <EmptyState
          title="No records found"
          description="Try a different tab or widen your filters to see results."
        />
      );
    }

    let columns: { key: string, label: string }[] = [];
    if (activeTab === 'Sales') {
      columns = [
        { key: 'name', label: 'Deal Name' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'stage', label: 'Stage' },
        { key: 'status', label: 'Status' }
      ];
    } else if (activeTab === 'Finance') {
      columns = [
        { key: 'invoiceNumber', label: 'Invoice #' },
        { key: 'subtotal', label: 'Subtotal' },
        { key: 'total', label: 'Total' },
        { key: 'status', label: 'Status' },
        { key: 'issueDate', label: 'Issue Date' }
      ];
    } else if (activeTab === 'HR') {
      columns = [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' }
      ];
    } else if (activeTab === 'Projects') {
      columns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Project Name' },
        { key: 'status', label: 'Status' },
        { key: 'budget', label: 'Budget' }
      ];
    } else if (activeTab === 'Activity') {
      columns = [
        { key: 'title', label: 'Title' },
        { key: 'priority', label: 'Priority' },
        { key: 'status', label: 'Status' }
      ];
    } else {
      const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object').slice(0, 5);
      columns = keys.map(k => ({ key: k, label: k }));
    }

    return (
      <div className="rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
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
    <div className="space-y-6">
      <PageHeader
        title="Advanced Analytics"
        description="Deep dive into your modules with custom filtering."
        actions={
          <div className="flex items-center gap-3">
            <SavedFilters currentGroup={filterGroup} onLoad={handleApplyFilter} />
            <FilterBuilder fields={getFieldsForModule()} onApply={handleApplyFilter} onClear={() => handleApplyFilter({ logic: 'AND', rules: [] })} />
          </div>
        }
      />

      <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-3 pt-1">
        <div className="border-b border-gray-100">
          <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-semibold transition-colors ${activeTab === tab
                  ? 'border-[#C1172C] text-[#C1172C]'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-3 pb-5 pt-5">
          <SectionTitle
            label={`Query results · ${activeTab}`}
            action={<span className="text-xs text-gray-400">{data?.length ?? 0} record{data?.length === 1 ? '' : 's'}</span>}
          />

          {loading ? (
            <LoadingState label="Running query…" />
          ) : (
            <div className="animate-in fade-in duration-300">
              {renderDataGrid()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
