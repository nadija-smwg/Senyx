"use client";

import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from 'recharts';

interface PipelineFunnelProps {
  title: string;
  data: any[];
  nameKey: string;
  dataKey: string;
  height?: number;
  className?: string;
}

export function PipelineFunnel({ title, data, nameKey, dataKey, height = 300, className = '' }: PipelineFunnelProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-400">No data available for {title}</p>
      </div>
    );
  }

  // Ensure data is sorted by the dataKey descending for a proper funnel shape
  const sortedData = [...data].sort((a, b) => b[dataKey] - a[dataKey]);

  // Map to distinct colors for each stage
  const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
  const dataWithFill = sortedData.map((d, i) => ({
    ...d,
    fill: colors[i % colors.length]
  }));

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <h3 className="text-gray-700 font-medium mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Funnel
              dataKey={dataKey}
              data={dataWithFill}
              isAnimationActive
            >
              <LabelList position="right" fill="#333" stroke="none" dataKey={nameKey} />
              <LabelList position="inside" fill="#fff" stroke="none" dataKey={dataKey} />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
