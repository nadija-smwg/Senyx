import { useCurrency } from '@/providers/currency-provider';
import { cn } from '@/lib/utils';
import { Badge } from './badge';

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
}

export function CurrencyDisplay({ amount, className }: CurrencyDisplayProps) {
  const { currency, convert, isLoading } = useCurrency();
  
  if (isLoading) {
    return <span className="animate-pulse bg-slate-100 rounded h-6 w-24 inline-block"></span>;
  }

  const convertedAmount = convert(amount);
  const isNegative = convertedAmount < 0;
  const absoluteAmount = Math.abs(convertedAmount);
  
  // Format very large numbers cleanly (e.g. 1.2M instead of 1,200,000.00)
  const isLargeNumber = absoluteAmount >= 1000000;
  
  const displayAmount = isLargeNumber
    ? (absoluteAmount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + 'M'
    : absoluteAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div 
      className={cn("inline-flex items-center gap-1.5 font-heading tabular-nums", className)}
      title={isLargeNumber ? absoluteAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : undefined}
    >
      {isNegative && <span className="text-destructive font-bold leading-none">-</span>}
      <Badge 
        variant="outline" 
        className="h-5 px-1.5 text-[10px] uppercase font-sans tracking-wider border-slate-200 text-slate-500 bg-slate-50 leading-none shadow-none font-medium"
      >
        {currency}
      </Badge>
      <span className={cn(isNegative ? "text-destructive" : "", "tracking-tight leading-none font-bold")}>
        {displayAmount}
      </span>
    </div>
  );
}
