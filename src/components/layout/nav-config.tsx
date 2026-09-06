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
    FileEdit,
} from 'lucide-react';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    /** If set, only users with one of these roles (or Admin) can see this item. */
    visibleTo?: string[];
}

export interface NavGroup {
    label: string;
    color: string; // module accent (hex)
    bg: string;    // module accent tint (hex)
    items: NavItem[];
    /** If set, only users with one of these roles (or Admin) can see this group. */
    visibleTo?: string[];
}

/**
 * Returns role-filtered navigation groups.
 * @param userRoles - The authenticated user's role names array.
 */
export function getNavGroups(userRoles: string[]): NavGroup[] {
    const isAdmin = userRoles.includes('Admin');

    const allGroups: NavGroup[] = [
        {
            label: 'Core',
            color: '#1A6DB6',
            bg: '#F0F9FF',
            items: [
                { href: '/', label: 'Dashboard', icon: LayoutDashboard },
                // { href: '/analytics', label: 'Analytics', icon: BarChart3 },
                // { href: '/help', label: 'Help Center', icon: HelpCircle },
            ],
        },
        {
            label: 'HR & People',
            color: '#7F4D9F',
            bg: '#F2E8FA',
            // All roles can see HR — employees see their own profile/leave
            items: [
                { href: '/hr/employees', label: 'Employees', icon: Users },
                { href: '/hr/leave', label: 'Leave', icon: ClipboardList },
                // Approval only visible to Admin & HR Manager
                { href: '/hr/approval', label: 'Approval', icon: CheckSquare, visibleTo: ['Admin', 'HR Manager'] },
            ],
        },
        {
            label: 'CRM & Sales',
            color: '#F15A22',
            bg: '#FEF0EB',
            // Only Sales Lead and Admin can access CRM
            visibleTo: ['Admin', 'Sales Lead'],
            items: [
                { href: '/crm/accounts', label: 'Accounts', icon: Building2 },
                { href: '/crm/contacts', label: 'Contacts', icon: Contact2 },
            ],
        },
        {
            label: 'Projects',
            color: '#059669',
            bg: '#ECFDF5',
            // All roles can see Projects (employees can view assigned projects)
            items: [
                { href: '/projects', label: 'Projects', icon: FolderKanban },
            ],
        },
        /*
        {
            label: 'Finance',
            color: '#C1172C',
            bg: '#FCECEC',
            visibleTo: ['Admin', 'Finance'],
            items: [
                { href: '/finance', label: 'Overview', icon: DollarSign },
                { href: '/finance/invoices', label: 'Invoices', icon: FileText },
                { href: '/finance/expenses', label: 'Expenses', icon: Wallet },
                { href: '/finance/payments', label: 'Payments', icon: CreditCard },
                { href: '/sales/deals', label: 'Deals', icon: HandshakeIcon },
            ],
        },
        */
        {
            label: 'System',
            color: '#3B3B3B',
            bg: '#F3F4F6',
            items: [
                { href: '/settings', label: 'Settings', icon: Settings },
                { href: '/audit', label: 'Audit Logs', icon: Shield, visibleTo: ['Admin', 'Auditor'] },
                { href: '/change-requests', label: 'Change Requests', icon: FileEdit },
            ],
        },
    ];

    return allGroups
        // Filter groups by role
        .filter(group => {
            if (!group.visibleTo) return true;
            if (isAdmin) return true;
            return group.visibleTo.some(r => userRoles.includes(r));
        })
        // Filter items within each group by role
        .map(group => ({
            ...group,
            items: group.items.filter(item => {
                if (!item.visibleTo) return true;
                if (isAdmin) return true;
                return item.visibleTo.some(r => userRoles.includes(r));
            }),
        }))
        // Drop any groups left empty after item-level filtering
        .filter(group => group.items.length > 0);
}

export function isItemActive(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
}