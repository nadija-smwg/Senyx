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
  positive: { iconBg: '#ECFDF5', iconColor: '#059669', sparkColor: '#059669', accent: '#059669' },
  negative: { iconBg: '#FCECEC', iconColor: '#C1172C', sparkColor: '#C1172C', accent: '#C1172C' },
  warning: { iconBg: '#FEF0EB', iconColor: '#F15A22', sparkColor: '#F15A22', accent: '#F15A22' },
  neutral: { iconBg: '#E9F5FA', iconColor: '#1A6DB6', sparkColor: '#1A6DB6', accent: '#1A6DB6' },
};

export function KPICard({ title, value, trend, icon, subtitle, status = 'neutral', onClick, className = '', isHero = false, sparklineData }: KPICardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const cfg = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative h-full rounded-xl bg-white border border-gray-100 transition-all duration-200 flex flex-col",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Subtle accent rail — top border in status color */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl"
        style={{ backgroundColor: cfg.accent, opacity: 0.85 }}
      />

      <div className={cn("flex-1 flex flex-col justify-between p-5", isHero && "p-6")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className={cn(
            "font-semibold uppercase tracking-[0.14em] text-gray-400 truncate",
            isHero ? "text-xs" : "text-[11px]"
          )}>
            {title}
          </p>
          {icon && (
            <div
              className={cn(
                "rounded-lg flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]",
                isHero ? "w-10 h-10" : "w-9 h-9"
              )}
              style={{ backgroundColor: cfg.iconBg, color: cfg.iconColor }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className={cn(
          "font-bold tracking-tight text-gray-900 font-heading tabular-nums truncate",
          isHero ? "text-3xl" : "text-[26px] leading-tight"
        )}>
          {value}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-gray-100/80 flex items-end justify-between gap-3 min-h-[28px]">
          <div className="flex items-center gap-2 text-xs min-w-0 flex-1">
            {trend !== undefined && (
              <span className={cn(
                "inline-flex items-center gap-0.5 font-semibold shrink-0",
                isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-gray-400'
              )}>
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : isNegative ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle && <span className="text-gray-400 text-[11px] truncate">{subtitle}</span>}
          </div>

          {sparklineData && sparklineData.length > 0 && (
            <div className="w-20 h-9 opacity-90 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((val, i) => ({ val, i }))}>
                  <defs>
                    <linearGradient id={`kpi-light-${status}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cfg.sparkColor} stopOpacity={0.28} />
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
