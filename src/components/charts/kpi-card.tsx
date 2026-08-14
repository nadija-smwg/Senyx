import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KPICardProps {
  title: string;
  value: ReactNode;
  trend?: number;
  icon?: ReactNode;
  subtitle?: string;
  status?: "positive" | "negative" | "warning" | "neutral";
  onClick?: () => void;
  className?: string;
  isHero?: boolean;
  sparklineData?: number[];
}

const statusConfig = {
  positive: { iconBg: '#ECFDF5', iconColor: '#059669', sparkColor: '#059669', border: '#059669' },
  negative: { iconBg: '#FCECEC', iconColor: '#C1172C', sparkColor: '#C1172C', border: '#C1172C' },
  warning:  { iconBg: '#FEF0EB', iconColor: '#F15A22', sparkColor: '#F15A22', border: '#F15A22' },
  neutral:  { iconBg: '#E9F5FA', iconColor: '#1A6DB6', sparkColor: '#1A6DB6', border: '#1A6DB6' },
};

export function KPICard({ title, value, trend, icon, subtitle, status = 'neutral', onClick, className = '', isHero = false, sparklineData }: KPICardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const cfg = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl bg-white border border-gray-100 transition-all duration-200 flex flex-col cursor-default",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
      style={{ borderTop: `2px solid ${cfg.border}` }}
    >
      <div className={cn("p-5 flex-1 flex flex-col justify-between", isHero && "p-6")}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <p className={cn("font-semibold uppercase tracking-widest text-gray-400", isHero ? "text-[11px]" : "text-[10px]")}>
            {title}
          </p>
          {icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4" style={{
              backgroundColor: cfg.iconBg,
              color: cfg.iconColor,
            }}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className={cn("font-bold tracking-tight text-gray-900 font-heading", isHero ? "text-3xl" : "text-2xl")}>
          {value}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span className={cn("flex items-center gap-0.5 font-semibold", isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-400')}>
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : isNegative ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle && <span className="text-gray-400 text-[11px]">{subtitle}</span>}
          </div>

          {sparklineData && sparklineData.length > 0 && (
            <div className="w-20 h-9 opacity-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((val, i) => ({ val, i }))}>
                  <defs>
                    <linearGradient id={`kpi-light-${status}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cfg.sparkColor} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={cfg.sparkColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke={cfg.sparkColor} fill={`url(#kpi-light-${status})`} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
