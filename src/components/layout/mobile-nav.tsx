'use client';

import { useState } from 'react';
import { Menu, X, LayoutDashboard, Activity, HelpCircle, Users, Briefcase, FolderKanban, Receipt, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '../ui/logo';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md" onClick={() => setOpen(true)}>
        <Menu className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-slate-300 animate-in slide-in-from-left">
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <Logo className="scale-90 origin-left" />
        <button className="p-2 bg-slate-800 rounded-md" onClick={() => setOpen(false)}>
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-900"><LayoutDashboard className="w-5 h-5" /> Dashboard</Link>
        <Link href="/analytics" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-900"><Activity className="w-5 h-5" /> Analytics</Link>
        <Link href="/hr/employees" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-900"><Users className="w-5 h-5" /> Employees</Link>
        <Link href="/crm/accounts" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-900"><Briefcase className="w-5 h-5" /> CRM & Sales</Link>
        <Link href="/projects" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-900"><FolderKanban className="w-5 h-5" /> Projects</Link>
        <Link href="/finance" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-900"><Receipt className="w-5 h-5" /> Finance</Link>
        <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-900"><Settings className="w-5 h-5" /> Settings</Link>
        <Link href="/help" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-900"><HelpCircle className="w-5 h-5" /> Help Center</Link>
      </div>
    </div>
  );
}
