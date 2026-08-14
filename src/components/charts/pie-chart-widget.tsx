"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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

const DEFAULT_COLORS = ['#1A6DB6', '#7F4D9F', '#F15A22', '#C1172C', '#22BFE8', '#3E308E', '#F9A01B'];

function LightTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.fill || payload[0].fill }} />
        <span className="text-gray-500">{payload[0].name}:</span>
        <span className="text-gray-900 font-semibold">{Number(payload[0].value || 0).toLocaleString()}</span>
      </div>
    </div>
  );
}

function LightLegend({ data, nameKey, colors }: { data: any[], nameKey: string, colors: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {data.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
          <span className="text-xs text-gray-500">{entry[nameKey]}</span>
        </div>
      ))}
    </div>
  );
}

export function PieChartWidget({ title, data, nameKey, dataKey, colors = DEFAULT_COLORS, height = 300, className = '', innerRadius = 0 }: PieChartWidgetProps) {
  if (!data?.length) {
    return (
      <div className={`bg-white rounded-xl border border-gray-100 p-6 flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-400 text-sm">No data for {title}</p>
      </div>
    );
  }
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4" style={{ height: height - 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<LightTooltip />} />
            <Pie data={data} nameKey={nameKey} dataKey={dataKey} cx="50%" cy="50%"
              innerRadius={innerRadius} outerRadius={75} paddingAngle={3} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <LightLegend data={data} nameKey={nameKey} colors={colors} />
      </div>
    </div>
  );
}
