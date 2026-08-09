import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number; // percentage, positive or negative
  icon?: ReactNode;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export function KPICard({ title, value, trend, icon, subtitle, onClick, className = '' }: KPICardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  
  return (
    <div 
      onClick={onClick}
      className={`bg-white/90 backdrop-blur-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-6 flex flex-col relative overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300' : 'hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)] transition-all duration-300'} ${className}`}
    >
      <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-gradient-to-br from-primary/20 to-[var(--color-brand-purple)]/20 rounded-full blur-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-slate-500 font-semibold text-xs tracking-wide uppercase">{title}</h3>
        {icon && <div className="text-primary bg-primary/10 p-2.5 rounded-xl shadow-sm ring-1 ring-primary/20 group-hover:scale-110 transition-transform duration-300">{icon}</div>}
      </div>
      
      <div className="flex items-baseline space-x-2 relative z-10">
        <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
      </div>

      <div className="mt-4 flex items-center text-sm relative z-10">
        {trend !== undefined ? (
          <span className={`flex items-center font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : isNegative ? <ArrowDownRight className="w-4 h-4 mr-1" /> : <Minus className="w-4 h-4 mr-1" />}
            {Math.abs(trend)}%
          </span>
        ) : null}
        
        {subtitle && (
          <span className={`text-gray-500 ${trend !== undefined ? 'ml-2' : ''}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
