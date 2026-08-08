"use client";

import { BarChartWidget } from './bar-chart-widget';

interface AgingChartProps {
  title: string;
  data: any[];
  height?: number;
  className?: string;
}

export function AgingChart({ title, data, height = 300, className = '' }: AgingChartProps) {
  const bars = [
    { key: 'Current', color: '#10b981', stacked: true },
    { key: '1-30 Days', color: '#fcd34d', stacked: true },
    { key: '31-60 Days', color: '#f59e0b', stacked: true },
    { key: '61-90 Days', color: '#f97316', stacked: true },
    { key: '90+ Days', color: '#ef4444', stacked: true },
  ];

  return (
    <BarChartWidget
      title={title}
      data={data}
      xAxisKey="Account Name"
      bars={bars}
      height={height}
      className={className}
    />
  );
}
