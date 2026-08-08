"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieChartWidgetProps {
  title: string;
  data: any[];
  nameKey: string;
  dataKey: string;
  colors?: string[];
  height?: number;
  className?: string;
  innerRadius?: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export function PieChartWidget({ 
  title, data, nameKey, dataKey, colors = DEFAULT_COLORS, height = 300, className = '', innerRadius = 0 
}: PieChartWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-400">No data available for {title}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <h3 className="text-gray-700 font-medium mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Pie
              data={data}
              nameKey={nameKey}
              dataKey={dataKey}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
