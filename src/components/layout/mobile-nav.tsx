'use client';

import { useState } from 'react';
import { Menu, X, LayoutDashboard, Activity, HelpCircle, Users, Briefcase, FolderKanban, Receipt, Settings } from 'lucide-react';
import Link from 'next/link';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/30 transition-colors" onClick={() => setOpen(true)}>
        <Menu className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col text-gray-900 animate-in slide-in-from-left-4 duration-300">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src="/logo-transparent.png" alt="Senyx Icon" className="w-7 h-7 object-contain" />
          <img src="/name-transparent.png" alt="SENYX" className="h-4 object-contain" />
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/30 transition-colors" onClick={() => setOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9FF] hover:text-[#1A6DB6] font-medium transition-colors"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
        <Link href="/analytics" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9FF] hover:text-[#1A6DB6] font-medium transition-colors"><Activity className="w-5 h-5" /> Analytics</Link>
        
        <div className="h-px bg-gray-100 my-2 mx-2" />
        
        <Link href="/hr/employees" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2E8FA] hover:text-[#7F4D9F] font-medium transition-colors"><Users className="w-5 h-5" /> Employees</Link>
        
        <div className="h-px bg-gray-100 my-2 mx-2" />
        
        <Link href="/crm/accounts" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF3EC] hover:text-[#F15A22] font-medium transition-colors"><Briefcase className="w-5 h-5" /> CRM & Sales</Link>
        <Link href="/projects" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF3EC] hover:text-[#F15A22] font-medium transition-colors"><FolderKanban className="w-5 h-5" /> Projects</Link>
        
        <div className="h-px bg-gray-100 my-2 mx-2" />
        
        <Link href="/finance/invoices" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9FF] hover:text-[#1A6DB6] font-medium transition-colors"><Receipt className="w-5 h-5" /> Finance</Link>
        
        <div className="h-px bg-gray-100 my-2 mx-2" />
        
        <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FDF3F4] hover:text-[#C1172C] font-medium transition-colors"><Settings className="w-5 h-5" /> Settings</Link>
        <Link href="/help" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"><HelpCircle className="w-5 h-5" /> Help Center</Link>
      </div>
    </div>
  );
}
