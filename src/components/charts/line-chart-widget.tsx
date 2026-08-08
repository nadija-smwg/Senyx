"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartWidgetProps {
  title: string;
  data: any[];
  xAxisKey: string;
  lines: { key: string; color: string; name?: string }[];
  height?: number;
  className?: string;
}

export function LineChartWidget({ title, data, xAxisKey, lines, height = 300, className = '' }: LineChartWidgetProps) {
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
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {lines.map((line, idx) => (
              <Line 
                key={line.key} 
                type="monotone" 
                dataKey={line.key} 
                name={line.name || line.key} 
                stroke={line.color} 
                strokeWidth={3}
                dot={{ r: 4, fill: line.color, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: line.color, stroke: '#fff', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
