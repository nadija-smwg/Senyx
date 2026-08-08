'use client';

import { HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface ContextualHelpProps {
  tooltip?: string;
  href?: string;
  className?: string;
}

export function ContextualHelp({ tooltip, href = '/help', className = '' }: ContextualHelpProps) {
  return (
    <div className={`group relative inline-flex items-center justify-center ${className}`}>
      <Link href={href} className="text-muted-foreground hover:text-primary transition-colors">
        <HelpCircle className="w-4 h-4" />
      </Link>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-slate-800 text-xs text-slate-100 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-center shadow-lg">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
}
