"use client";



interface HeatmapData {
  day: string; // 'Mon', 'Tue', etc.
  hour: number; // 0-23
  value: number; // intensity
}

interface ActivityHeatmapProps {
  title: string;
  data: HeatmapData[];
  className?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ActivityHeatmap({ title, data, className = '' }: ActivityHeatmapProps) {
  // Find max value to normalize intensity
  const maxValue = Math.max(...data.map(d => d.value), 1);

  const getIntensity = (day: string, hour: number) => {
    const item = data.find(d => d.day === day && d.hour === hour);
    if (!item || item.value === 0) return 0;
    return Math.max(0.1, item.value / maxValue); // min 0.1 opacity if > 0
  };

  const getValue = (day: string, hour: number) => {
    const item = data.find(d => d.day === day && d.hour === hour);
    return item ? item.value : 0;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
      <h3 className="text-slate-700 font-heading font-bold mb-4">{title}</h3>
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px]">
          <div className="flex">
            {/* Y-axis (Days) */}
            <div className="w-12 flex flex-col justify-between pt-6 text-[10px] text-slate-400 font-medium h-[240px]">
              {DAYS.map(day => (
                <div key={day} className="h-6 flex items-center justify-end pr-2">{day}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 flex flex-col h-[240px]">
              {DAYS.map(day => (
                <div key={day} className="flex-1 flex gap-1 mb-1">
                  {HOURS.map(hour => {
                    const intensity = getIntensity(day, hour);
                    const val = getValue(day, hour);
                    return (
                      <div 
                        key={`${day}-${hour}`}
                        className="flex-1 rounded-sm cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all"
                        style={{ 
                          backgroundColor: intensity > 0 ? `rgba(79, 70, 229, ${intensity})` : '#f8fafc' 
                        }}
                        title={`${day}, ${formatHour(hour)}: ${val} actions`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* X-axis (Hours) */}
          <div className="flex ml-12 mt-2">
            {HOURS.map((hour, idx) => (
              <div key={hour} className="flex-1 text-center text-[9px] text-slate-400">
                {idx % 3 === 0 ? formatHour(hour) : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
