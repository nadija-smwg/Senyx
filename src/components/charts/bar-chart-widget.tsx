"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartWidgetProps {
  title: string;
  data: any[];
  xAxisKey: string;
  bars: { key: string; color: string; name?: string; stacked?: boolean }[];
  height?: number;
  className?: string;
}

function LightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-500 mb-1.5">{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: e.fill }} />
          <span className="text-gray-900 font-semibold tabular-nums">{Number(e.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function BarChartWidget({ title, data, xAxisKey, bars, height = 300, className = '' }: BarChartWidgetProps) {
  if (!data?.length) {
    return (
      <div className={`bg-white rounded-xl border border-gray-100 p-6 flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-400 text-sm">No data for {title}</p>
      </div>
    );
  }
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden h-full flex flex-col ${className}`}>
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4 flex-1" style={{ height: height - 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} dy={6} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} dx={-4} />
            <Tooltip content={<LightTooltip />} cursor={{ fill: 'rgba(0,0,0,0.025)' }} />
            {bars.map(bar => (
              <Bar key={bar.key} dataKey={bar.key} name={bar.name || bar.key} fill={bar.color}
                radius={[4, 4, 0, 0]} stackId={bar.stacked ? "a" : undefined} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
