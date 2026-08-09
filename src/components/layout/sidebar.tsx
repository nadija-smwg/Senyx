'use client';
import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, FolderKanban, Receipt, Settings, Activity, Shield, HelpCircle } from 'lucide-react';
import { Logo } from '../ui/logo';

export function Sidebar() {
  const { roles } = useAuth();
  const pathname = usePathname();

  const navGroups = [
    {
      label: 'Core',
      items: [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/analytics', label: 'Analytics', icon: Activity },
        { href: '/help', label: 'Help Center', icon: HelpCircle },
      ]
    },
    {
      label: 'HR & People',
      items: [
        { href: '/hr/employees', label: 'Employees', icon: Users },
      ]
    },
    {
      label: 'CRM & Sales',
      items: [
        { href: '/crm/accounts', label: 'Accounts', icon: Briefcase },
        { href: '/crm/contacts', label: 'Contacts', icon: Users },
        { href: '/sales/deals', label: 'Deals', icon: Briefcase },
      ]
    },
    {
      label: 'Projects',
      items: [
        { href: '/projects', label: 'Projects', icon: FolderKanban },
      ]
    },
    {
      label: 'Finance',
      items: [
        { href: '/finance', label: 'Overview', icon: Receipt },
        { href: '/finance/invoices', label: 'Invoices', icon: Receipt },
        { href: '/finance/expenses', label: 'Expenses', icon: Receipt },
        { href: '/finance/payments', label: 'Payments', icon: Receipt },
        { href: '/finance/subscriptions', label: 'Subscriptions', icon: Receipt },
      ]
    },
    {
      label: 'System',
      items: [
        { href: '/settings', label: 'Settings', icon: Settings },
        { href: '/audit', label: 'Audit Logs', icon: Shield },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 h-screen flex flex-col hidden md:flex shrink-0 shadow-xl z-20 border-r border-slate-800/50">
      <div className="p-5 flex items-center border-b border-slate-800/50 h-[72px]">
        <Logo className="scale-90 origin-left" />
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 dark-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-slate-900 hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800/50 bg-slate-950/50">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-300">
            Me
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-slate-200">Current User</p>
            {roles.length > 0 && <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">{roles[0]}</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
