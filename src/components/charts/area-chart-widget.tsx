"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AreaChartWidgetProps {
  title: string;
  data: any[];
  xAxisKey: string;
  areas: { key: string; color: string; name: string }[];
}

function LightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-500 mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="text-gray-900 font-semibold">${Number(entry.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function AreaChartWidget({ title, data, xAxisKey, areas }: AreaChartWidgetProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-4">
          {areas.map(a => (
            <div key={a.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
              <span className="text-xs text-gray-400">{a.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                {areas.map(a => (
                  <linearGradient key={a.key} id={`lg-${a.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={a.color} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={a.color} stopOpacity={0.01} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<LightTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
              {areas.map(a => (
                <Area key={a.key} type="monotone" dataKey={a.key} name={a.name} stroke={a.color}
                  fill={`url(#lg-${a.key})`} strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: a.color, stroke: '#fff', strokeWidth: 2 }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
