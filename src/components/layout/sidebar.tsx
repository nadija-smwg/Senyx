'use client';
import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Briefcase, FolderKanban, Settings, Activity,
  Shield, HelpCircle, Contact2, HandshakeIcon, Wallet, CreditCard,
  BarChart3, Building2, FileText, DollarSign, ClipboardList
} from 'lucide-react';
import { Logo } from '../ui/logo';

const navGroups = [
  {
    label: 'Core',
    color: '#1A6DB6', // Blue
    bg: '#F0F9FF',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/help', label: 'Help Center', icon: HelpCircle },
    ]
  },
  {
    label: 'HR & People',
    color: '#7F4D9F', // Purple
    bg: '#F2E8FA',
    items: [
      { href: '/hr/employees', label: 'Employees', icon: Users },
      { href: '/hr/leave', label: 'Leave', icon: ClipboardList },
    ]
  },
  {
    label: 'CRM & Sales',
    color: '#F15A22', // Orange
    bg: '#FEF0EB',
    items: [
      { href: '/crm/accounts', label: 'Accounts', icon: Building2 },
      { href: '/crm/contacts', label: 'Contacts', icon: Contact2 },
      { href: '/sales/deals', label: 'Deals', icon: HandshakeIcon },
    ]
  },
  {
    label: 'Projects',
    color: '#059669', // Emerald
    bg: '#ECFDF5',
    items: [
      { href: '/projects', label: 'Projects', icon: FolderKanban },
    ]
  },
  {
    label: 'Finance',
    color: '#C1172C', // Red
    bg: '#FCECEC',
    items: [
      { href: '/finance', label: 'Overview', icon: DollarSign },
      { href: '/finance/invoices', label: 'Invoices', icon: FileText },
      { href: '/finance/expenses', label: 'Expenses', icon: Wallet },
      { href: '/finance/payments', label: 'Payments', icon: CreditCard },
    ]
  },
  {
    label: 'System',
    color: '#3B3B3B', // Ash
    bg: '#F3F4F6',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/audit', label: 'Audit Logs', icon: Shield },
    ]
  }
];

export function Sidebar() {
  const { roles } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen flex flex-col hidden md:flex shrink-0 z-20" style={{
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
    }}>
      {/* Logo */}
      <div className="h-[64px] flex items-center px-5 shrink-0 group cursor-pointer" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-3">
          <img src="/logo-transparent.png" alt="Senyx Icon" className="w-8 h-8 object-contain group-hover:scale-105 transition-transform duration-300" />
          <div className="flex flex-col justify-center mt-1">
            <img src="/name-transparent.png" alt="SENYX" className="h-5 object-contain object-left" />
            <div className="text-[9px] font-bold tracking-[0.15em] uppercase mt-0.5" style={{ color: '#1A6DB6' }}>
              Command Center
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 py-2 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22BFE8]/30 ${
                      isActive
                        ? 'font-bold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={isActive ? { 
                      backgroundColor: group.bg, 
                      color: group.color,
                      borderLeft: `3px solid ${group.color}`,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    } : {
                      borderLeft: '3px solid transparent'
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-all duration-200" style={{ 
                      color: isActive ? group.color : group.color,
                      opacity: isActive ? 1 : 0.6
                    }} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid #E5E7EB' }}>
        <div className="text-[10px] font-mono text-gray-400">Senyx v1.0</div>
        <div className="flex items-center gap-1.5">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
           <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">All systems operational</span>
        </div>
      </div>
    </aside>
  );
}
