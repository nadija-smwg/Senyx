'use client';

import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Settings,
    Shield,
    HelpCircle,
    Contact2,
    HandshakeIcon,
    Wallet,
    CreditCard,
    BarChart3,
    Building2,
    FileText,
    DollarSign,
    ClipboardList,
    CheckSquare,
} from 'lucide-react';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

export interface NavGroup {
    label: string;
    color: string; // module accent (hex)
    bg: string;    // module accent tint (hex)
    items: NavItem[];
}

/**
 * Returns the full navigation hierarchy.
 * `includeAdminItems` controls whether HR-Manager-only entries (e.g. Approval)
 * are included — derived from the caller's roles.
 */
export function getNavGroups(includeAdminItems: boolean): NavGroup[] {
    return [
        {
            label: 'Core',
            color: '#1A6DB6',
            bg: '#F0F9FF',
            items: [
                { href: '/', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/analytics', label: 'Analytics', icon: BarChart3 },
                { href: '/help', label: 'Help Center', icon: HelpCircle },
            ],
        },
        {
            label: 'HR & People',
            color: '#7F4D9F',
            bg: '#F2E8FA',
            items: [
                { href: '/hr/employees', label: 'Employees', icon: Users },
                { href: '/hr/leave', label: 'Leave', icon: ClipboardList },
                ...(includeAdminItems
                    ? [{ href: '/hr/approval', label: 'Approval', icon: CheckSquare }]
                    : []),
            ],
        },
        {
            label: 'CRM & Sales',
            color: '#F15A22',
            bg: '#FEF0EB',
            items: [
                { href: '/crm/accounts', label: 'Accounts', icon: Building2 },
                { href: '/crm/contacts', label: 'Contacts', icon: Contact2 },
            ],
        },
        {
            label: 'Projects',
            color: '#059669',
            bg: '#ECFDF5',
            items: [
                { href: '/projects', label: 'Projects', icon: FolderKanban },
            ],
        },
        {
            label: 'Finance',
            color: '#C1172C',
            bg: '#FCECEC',
            items: [
                { href: '/finance', label: 'Overview', icon: DollarSign },
                { href: '/finance/invoices', label: 'Invoices', icon: FileText },
                { href: '/finance/expenses', label: 'Expenses', icon: Wallet },
                { href: '/finance/payments', label: 'Payments', icon: CreditCard },
                { href: '/sales/deals', label: 'Deals', icon: HandshakeIcon },
            ],
        },
        {
            label: 'System',
            color: '#3B3B3B',
            bg: '#F3F4F6',
            items: [
                { href: '/settings', label: 'Settings', icon: Settings },
                { href: '/audit', label: 'Audit Logs', icon: Shield },
            ],
        },
    ];
}

export function isItemActive(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
}