'use client';
import Link from 'next/link';
import { useAuth } from '../../hooks/use-auth';

export function Sidebar() {
  const { roles } = useAuth();
  
  return (
    <aside className="w-64 bg-primary text-primary-foreground h-screen flex flex-col hidden md:flex shrink-0">
      <div className="p-4 text-2xl font-heading font-bold border-b border-primary-foreground/10">
        SENYX
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
            Core
          </h3>
          <div className="space-y-1">
            <Link href="/" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
        
        <div>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
            HR & People
          </h3>
          <div className="space-y-1">
            <Link href="/hr/employees" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Employees
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
            CRM & Sales
          </h3>
          <div className="space-y-1">
            <Link href="/crm/accounts" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Accounts
            </Link>
            <Link href="/crm/contacts" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Contacts
            </Link>
            <Link href="/sales/deals" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Deals
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
            Projects
          </h3>
          <div className="space-y-1">
            <Link href="/projects" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Projects
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
            Finance
          </h3>
          <div className="space-y-1">
            <Link href="/finance" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Overview
            </Link>
            <Link href="/finance/invoices" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Invoices
            </Link>
            <Link href="/finance/expenses" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Expenses
            </Link>
            <Link href="/finance/payments" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Payments
            </Link>
            <Link href="/finance/subscriptions" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Subscriptions
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
            System
          </h3>
          <div className="space-y-1">
            <Link href="/settings" className="block px-2 py-1.5 rounded hover:bg-primary-foreground/10 transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-primary-foreground/10">
        {roles.length > 0 && <span className="text-sm opacity-80">{roles.join(', ')}</span>}
      </div>
    </aside>
  );
}
