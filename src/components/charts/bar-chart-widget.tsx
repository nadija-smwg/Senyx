"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartWidgetProps {
  title: string;
  data: any[];
  xAxisKey: string;
  bars: { key: string; color: string; name?: string; stacked?: boolean }[];
  height?: number;
  className?: string;
}

export function BarChartWidget({ title, data, xAxisKey, bars, height = 300, className = '' }: BarChartWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-400">No data available for {title}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden ${className}`}>
      <h3 className="text-slate-700 font-heading font-bold mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              cursor={{ fill: '#f9f9f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {bars.map((bar, idx) => (
              <Bar 
                key={bar.key} 
                dataKey={bar.key} 
                name={bar.name || bar.key} 
                fill={bar.color} 
                radius={bar.stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                stackId={bar.stacked ? "a" : undefined}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
