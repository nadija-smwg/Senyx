'use client';

import { useState } from 'react';
import { Menu, X, LayoutDashboard, Activity, HelpCircle, Users, ClipboardList, Briefcase, HandshakeIcon, Contact2, FolderKanban, Receipt, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CurrencySelector } from './currency-selector';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/30 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-white w-[300px] border-r-0 flex flex-col">
        {/* Hidden title/description for screen readers to fix accessibility warnings */}
        <span className="sr-only">
          <SheetTitle>Mobile Navigation</SheetTitle>
          <SheetDescription>Navigate through the application</SheetDescription>
        </span>

        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo-transparent.png" alt="Senyx Icon" className="w-7 h-7 object-contain" />
            <img src="/name-transparent.png" alt="SENYX" className="h-4 object-contain" />
          </div>
          <button type="button" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/30 transition-colors" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9FF] hover:text-[#1A6DB6] font-medium transition-colors"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
          <Link href="/analytics" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9FF] hover:text-[#1A6DB6] font-medium transition-colors"><Activity className="w-5 h-5" /> Analytics</Link>
          
          <div className="h-px bg-gray-100 my-2 mx-2" />
          
          <Link href="/hr/employees" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2E8FA] hover:text-[#7F4D9F] font-medium transition-colors"><Users className="w-5 h-5" /> Employees</Link>
          <Link href="/hr/leave" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2E8FA] hover:text-[#7F4D9F] font-medium transition-colors"><ClipboardList className="w-5 h-5" /> Leave</Link>
          
          <div className="h-px bg-gray-100 my-2 mx-2" />
          
          <Link href="/crm/accounts" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF3EC] hover:text-[#F15A22] font-medium transition-colors"><Briefcase className="w-5 h-5" /> Accounts</Link>
          <Link href="/crm/contacts" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF3EC] hover:text-[#F15A22] font-medium transition-colors"><Contact2 className="w-5 h-5" /> Contacts</Link>
          <Link href="/sales/deals" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF3EC] hover:text-[#F15A22] font-medium transition-colors"><HandshakeIcon className="w-5 h-5" /> Deals</Link>
          <Link href="/projects" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF3EC] hover:text-[#F15A22] font-medium transition-colors"><FolderKanban className="w-5 h-5" /> Projects</Link>
          
          <div className="h-px bg-gray-100 my-2 mx-2" />
          
          <Link href="/finance/invoices" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9FF] hover:text-[#1A6DB6] font-medium transition-colors"><Receipt className="w-5 h-5" /> Finance</Link>
          
          <div className="h-px bg-gray-100 my-2 mx-2" />
          
          <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FDF3F4] hover:text-[#C1172C] font-medium transition-colors"><Settings className="w-5 h-5" /> Settings</Link>
          <Link href="/audit" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FDF3F4] hover:text-[#C1172C] font-medium transition-colors"><ShieldCheck className="w-5 h-5" /> Audit Logs</Link>
          <Link href="/help" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"><HelpCircle className="w-5 h-5" /> Help Center</Link>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
          <CurrencySelector />
        </div>
      </SheetContent>
    </Sheet>
  );
}
