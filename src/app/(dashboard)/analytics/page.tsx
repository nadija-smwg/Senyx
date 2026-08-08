"use client";

import { useState, useEffect } from 'react';
import { FilterBuilder, FilterGroup } from '@/components/data/filter-builder';
import { SavedFilters } from '@/components/data/saved-filters';
import { BarChartWidget } from '@/components/charts/bar-chart-widget';
import { LineChartWidget } from '@/components/charts/line-chart-widget';

const TABS = ['Sales', 'Projects', 'Finance', 'HR', 'Activity'];

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<string>(TABS[0] as string);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({ logic: 'AND', rules: [] });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (module: string, group: FilterGroup) => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: module.toLowerCase(), filters: group })
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
    fetchAnalytics(activeTab, filterGroup);
  }, [activeTab]);

  const handleApplyFilter = (group: FilterGroup) => {
    setFilterGroup(group);
    fetchAnalytics(activeTab, group);
  };

  const getFieldsForModule = () => {
    if (activeTab === 'Sales') return [{ label: 'Stage', value: 'stage', type: 'select' as const }, { label: 'Amount', value: 'amount', type: 'text' as const }];
    if (activeTab === 'Finance') return [{ label: 'Status', value: 'status', type: 'select' as const }, { label: 'Date', value: 'date', type: 'date' as const }];
    return [{ label: 'Keyword', value: 'keyword', type: 'text' as const }];
  };

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
               {/* We just show a placeholder chart with the returned data length for MVP since executeQuery returns raw data right now */}
               <div className="bg-white p-6 rounded-xl border border-gray-100 col-span-full">
                 <h3 className="font-medium text-gray-700 mb-2">Raw Data Query Results</h3>
                 <p className="text-gray-500 text-sm mb-4">Returned {data?.length || 0} records for {activeTab}</p>
                 <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                   {JSON.stringify(data, null, 2)}
                 </pre>
               </div>
            </div>
          )}
          {activeTab !== 'Sales' && (
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="font-medium text-gray-700 mb-2">Raw Data Query Results</h3>
              <p className="text-gray-500 text-sm mb-4">Returned {data?.length || 0} records for {activeTab}</p>
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
