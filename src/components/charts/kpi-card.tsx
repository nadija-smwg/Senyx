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
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-md transition-all hover:-translate-y-1' : ''} ${className}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-slate-500 font-semibold text-sm tracking-wide uppercase">{title}</h3>
        {icon && <div className="text-indigo-500 bg-indigo-50 p-2 rounded-lg">{icon}</div>}
      </div>
      
      <div className="flex items-baseline space-x-2 relative z-10">
        <span className="text-3xl font-heading font-black text-slate-900 tracking-tight">{value}</span>
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
