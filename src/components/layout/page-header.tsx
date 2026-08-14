import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  pretitle?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, pretitle, children, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden bg-white rounded-2xl p-6 sm:p-8 mb-8 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]", className)}>
      {/* Decorative background blobs using brand colors */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] rounded-[100%] bg-gradient-to-br from-[#22BFE8]/15 via-[#7F4D9F]/10 to-transparent blur-3xl transform rotate-12 pointer-events-none" />
      <div className="absolute bottom-[-50%] left-[-10%] w-[40%] h-[150%] rounded-[100%] bg-gradient-to-tr from-[#F9A01B]/15 via-[#EC4C49]/10 to-transparent blur-3xl transform -rotate-12 pointer-events-none" />
      
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          {pretitle && (
            <p className="text-xs font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#1A6DB6] via-[#7F4D9F] to-[#F15A22] bg-clip-text text-transparent mb-1.5">
              {pretitle}
            </p>
          )}
          <h1 className="text-3xl font-extrabold font-heading text-gray-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-gray-500 text-sm mt-1 max-w-xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {(actions || children) && (
          <div className="flex flex-wrap items-center gap-3">
            {actions}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
