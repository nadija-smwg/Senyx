"use client";

import { useCurrency, Currency } from '@/providers/currency-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2 } from 'lucide-react';

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'LKR', label: 'Sri Lankan Rupee', symbol: 'Rs' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' }
];

export function CurrencySelector() {
  const { currency, setCurrency, isLoading } = useCurrency();

  const current = CURRENCIES.find(c => c.value === currency) || CURRENCIES[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-slate-600 border-slate-200 bg-white font-medium">
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <span className="font-semibold text-slate-800 mr-1.5">{current.symbol}</span>}
          {current.value}
          <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {CURRENCIES.map((c) => (
          <DropdownMenuItem 
            key={c.value} 
            onClick={() => setCurrency(c.value)}
            className={`flex items-center justify-between cursor-pointer ${currency === c.value ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
          >
            <span>{c.label}</span>
            <span className="text-slate-400 font-semibold">{c.symbol}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
