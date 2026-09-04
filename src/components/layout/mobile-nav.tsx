'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CurrencySelector } from './currency-selector';
import { getNavGroups, isItemActive } from './nav-config';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { roles } = useAuth();
  const pathname = usePathname();
  const isAdminOrHR = roles.includes('Admin') || roles.includes('HR Manager');
  const navGroups = getNavGroups(isAdminOrHR);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/40 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-white w-[300px] border-r-0 flex flex-col">
        {/* Hidden title/description for screen readers */}
        <span className="sr-only">
          <SheetTitle>Mobile Navigation</SheetTitle>
          <SheetDescription>Navigate through the application</SheetDescription>
        </span>

        {/* Brand — original Senyx logo (icon + wordmark) */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] shrink-0">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 group">
            <img
              src="/logo-icon-transparent.png"
              alt="Senyx Icon"
              className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col justify-center leading-tight">
              <img
                src="/name-transparent.png"
                alt="SENYX"
                className="h-9 object-contain object-left"
              />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#1A6DB6] mt-0.5">
                ERP Platform
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/40 transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className={cn('space-y-1', groupIndex > 0 && 'mt-5')}>
              <h3 className="px-3 mb-1.5 flex items-center gap-2">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                  aria-hidden
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  {group.label}
                </span>
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-2.5 h-9 pl-3 pr-2.5 rounded-lg text-[13px] font-medium',
                        'transition-all duration-150 outline-none',
                        'focus-visible:ring-2 focus-visible:ring-[#22BFE8]/40 focus-visible:ring-offset-1',
                        !active && 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      style={
                        active
                          ? {
                            backgroundColor: group.bg,
                            color: group.color,
                            boxShadow: `inset 3px 0 0 ${group.color}`,
                          }
                          : undefined
                      }
                    >
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-all',
                          active ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'
                        )}
                        style={{ color: group.color }}
                      />
                      <span className={cn('flex-1 truncate', active && 'font-semibold')}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-gray-50 flex justify-center">
          <CurrencySelector />
        </div>
      </SheetContent>
    </Sheet>
  );
}
