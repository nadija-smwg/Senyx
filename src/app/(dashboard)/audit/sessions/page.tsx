"use client"

import { useEffect, useState } from "react"
import { BarChartWidget } from "@/components/charts/bar-chart-widget"
import { PieChartWidget } from "@/components/charts/pie-chart-widget"
import { LineChartWidget } from "@/components/charts/line-chart-widget"
import { ActivityHeatmap } from "@/components/charts/activity-heatmap"

export default function SessionAnalyticsPage() {
  const [loading, setLoading] = useState(true)

  const [heatmapData, setHeatmapData] = useState<{ day: string; hour: number; value: number }[]>([]);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => setLoading(false), 500)
    
    // Generate heatmap data
    const data: { day: string; hour: number; value: number }[] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(day => {
      for (let h = 0; h < 24; h++) {
        // higher activity between 9am and 5pm on weekdays
        const isWorkHour = h >= 9 && h <= 17;
        const isWeekend = day === 'Sat' || day === 'Sun';
        let val = 0;
        if (!isWeekend && isWorkHour) val = Math.floor(Math.random() * 50) + 20;
        else if (!isWeekend) val = Math.floor(Math.random() * 10);
        else val = Math.floor(Math.random() * 5);
        
        data.push({ day, hour: h, value: val });
      }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeatmapData(data);
  }, [])

  const sessionsPerDay = [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 150 },
    { name: 'Wed', value: 180 },
    { name: 'Thu', value: 190 },
    { name: 'Fri', value: 160 },
    { name: 'Sat', value: 40 },
    { name: 'Sun', value: 30 },
  ]

  const deviceBreakdown = [
    { name: 'Desktop (Windows)', value: 65, color: '#4f46e5' },
    { name: 'Desktop (Mac)', value: 20, color: '#0ea5e9' },
    { name: 'Mobile (iOS)', value: 10, color: '#10b981' },
    { name: 'Mobile (Android)', value: 5, color: '#f59e0b' },
  ]

  const browserBreakdown = [
    { name: 'Chrome', value: 70, color: '#4f46e5' },
    { name: 'Safari', value: 15, color: '#0ea5e9' },
    { name: 'Firefox', value: 10, color: '#10b981' },
    { name: 'Edge', value: 5, color: '#f59e0b' },
  ]


  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Session Analytics</h1>
          <p className="text-slate-500 mt-1">
            Track user sessions, devices, and engagement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <LineChartWidget 
            title="Sessions Over Time (Last 7 Days)" 
            data={sessionsPerDay} 
            xAxisKey="name"
            lines={[{ key: 'value', color: '#4f46e5', name: 'Sessions' }]}
            height={300}
          />
        </div>
        <PieChartWidget 
          title="Device Breakdown" 
          data={deviceBreakdown} 
          nameKey="name"
          dataKey="value"
          height={300}
        />
        <PieChartWidget 
          title="Browser Breakdown" 
          data={browserBreakdown} 
          nameKey="name"
          dataKey="value"
          height={300}
        />
        <BarChartWidget 
          title="Avg Session Duration (min)" 
          data={sessionsPerDay.map(d => ({ ...d, value: Math.floor(d.value / 4) }))} 
          xAxisKey="name"
          bars={[{ key: 'value', color: '#0ea5e9', name: 'Duration' }]}
          height={300}
        />
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <ActivityHeatmap title="Activity Heatmap" data={heatmapData} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
        <h3 className="text-slate-700 font-heading font-bold mb-4">Active Sessions</h3>
        {loading ? (
          <div className="h-24 flex items-center justify-center text-slate-500">Loading sessions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">User</th>
                  <th className="px-4 py-3">Started At</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">admin@senyx.com</td>
                  <td className="px-4 py-3 text-slate-500">2 mins ago</td>
                  <td className="px-4 py-3 text-slate-500">Mac OS • Chrome</td>
                  <td className="px-4 py-3 text-slate-500">192.168.1.1</td>
                  <td className="px-4 py-3 text-slate-500 text-right">0h 2m</td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">sales@senyx.com</td>
                  <td className="px-4 py-3 text-slate-500">45 mins ago</td>
                  <td className="px-4 py-3 text-slate-500">Windows • Edge</td>
                  <td className="px-4 py-3 text-slate-500">10.0.0.5</td>
                  <td className="px-4 py-3 text-slate-500 text-right">0h 45m</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
