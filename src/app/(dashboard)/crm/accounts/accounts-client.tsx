'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Globe, Mail, Plus, Users } from 'lucide-react';
import {
  CrmPageShell,
  CrmSearchBar,
  CrmStatCard,
  CrmTable,
  CrmStatusBadge,
  CrmAvatar,
  CrmNameCell,
  CrmEmptyState,
  CrmToolbar,
  CrmPagination,
  type CrmTableColumn,
} from '@/components/crm/crm-shell';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AccountForm } from '@/components/crm/account-form';

type Account = {
  id: string;
  name: string;
  industry?: string | null;
  size?: string | null;
  website?: string | null;
  status?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function AccountsClient({ initialAccounts }: { initialAccounts: Account[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'prospect' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setData(initialAccounts);
  }, [initialAccounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(a => {
      const matchSearch =
        !q ||
        a.name?.toLowerCase().includes(q) ||
        a.industry?.toLowerCase().includes(q) ||
        a.ownerName?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const counts = useMemo(() => {
    const total = data.length;
    const active = data.filter(a => a.status === 'active').length;
    const prospect = data.filter(a => a.status === 'prospect').length;
    const inactive = data.filter(a => a.status === 'inactive').length;
    return { total, active, prospect, inactive };
  }, [data]);

  const columns: CrmTableColumn<Account>[] = [
    {
      id: 'name',
      header: 'Account',
      cell: a => (
        <CrmNameCell
          name={a.name}
          supporting={a.industry || '—'}
          avatar={<CrmAvatar name={a.name} />}
        />
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: (a: Account) =>
        a.ownerName ? (
          <div className="flex items-center gap-2 min-w-0">
            <CrmAvatar name={a.ownerName} className="h-7 w-7 rounded-md" />
            <span className="text-sm text-gray-700 truncate">{a.ownerName}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Unassigned</span>
        ),
      hideOn: 'md',
    },
    {
      id: 'website',
      header: 'Website',
      cell: a =>
        a.website ? (
          <a
            href={a.website.startsWith('http') ? a.website : `https://${a.website}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#1A6DB6] hover:underline truncate max-w-[200px]"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{a.website.replace(/^https?:\/\//, '')}</span>
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      hideOn: 'sm',
    },
    {
      id: 'size',
      header: 'Size',
      cell: a => <span className="text-sm text-gray-700">{a.size || '—'}</span>,
      hideOn: 'md',
    },
    {
      id: 'status',
      header: 'Status',
      cell: a => <CrmStatusBadge status={a.status} />,
      width: 'w-[120px]',
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-[120px]',
      cell: a => (
        <div className="flex items-center justify-end gap-2">
          {a.website && (
            <a
              href={a.website.startsWith('http') ? a.website : `https://${a.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-[#1A6DB6] hover:bg-[#E6F4FB] transition-colors"
              aria-label="Open website"
              onClick={e => e.stopPropagation()}
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
          <AccountEditSheet account={a} onSaved={() => startTransition(() => router.refresh())} />
        </div>
      ),
    },
  ];

  return (
    <CrmPageShell
      pretitle="CRM"
      title="Accounts"
      description="Manage your client companies and prospects. Track owners, industry, and lifecycle status."
      actions={
              <AccountEditSheet
                trigger={
                  <Button className="gap-1.5 bg-[#F15A22] hover:bg-[#C9471A] text-white shadow-sm">
                    <Plus className="w-4 h-4" />
                    Add Account
                  </Button>
                }
                onSaved={() => startTransition(() => router.refresh())}
              />
      }
      stats={
        <>
          <CrmStatCard
            label="Total Accounts"
            value={counts.total}
            icon={<Building2 />}
            hint="All-time"
          />
          <CrmStatCard
            label="Active"
            value={counts.active}
            icon={<Users />}
            accent="positive"
            hint="Paying clients"
          />
          <CrmStatCard
            label="Prospects"
            value={counts.prospect}
            icon={<Mail />}
            accent="warning"
            hint="In pipeline"
          />
          <CrmStatCard
            label="Inactive"
            value={counts.inactive}
            icon={<Building2 />}
            accent="neutral"
            hint="Dormant"
          />
        </>
      }
      toolbar={
        <CrmToolbar>
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'active', 'prospect', 'inactive'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={
                  'h-7 px-3 rounded-md text-xs font-semibold transition-colors border ' +
                  (statusFilter === s
                    ? 'bg-[#FEF0EB] text-[#C9471A] border-[#FBD9C9]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')
                }
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="ml-1.5 text-[10px] tabular-nums text-gray-400">
                  {s === 'all' ? counts.total : s === 'active' ? counts.active : s === 'prospect' ? counts.prospect : counts.inactive}
                </span>
              </button>
            ))}
          </div>
          <CrmSearchBar
            value={search}
            onChange={v => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name, industry, or owner…"
          />
        </CrmToolbar>
      }
    >
      <CrmTable
        columns={columns}
        rows={pageRows}
        rowKey={r => r.id}
        loading={isPending}
            emptyState={
              <CrmEmptyState
                icon={<Building2 />}
                title={search || statusFilter !== 'all' ? 'No matching accounts' : 'No accounts yet'}
                description={
                  search || statusFilter !== 'all'
                    ? 'Try a different search term or remove filters.'
                    : 'Add your first client company to start building your CRM.'
                }
                action={
                  !search && statusFilter === 'all' ? (
                    <AccountEditSheet
                      trigger={
                        <Button className="gap-1.5 bg-[#F15A22] hover:bg-[#C9471A] text-white">
                          <Plus className="w-4 h-4" />
                          Add Account
                        </Button>
                      }
                      onSaved={() => startTransition(() => router.refresh())}
                    />
                  ) : undefined
                }
              />
            }
          />
          <div className="pt-3">
            <CrmPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
    </CrmPageShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Account edit / add sheet                                            */
/* ------------------------------------------------------------------ */

function AccountEditSheet({
  account,
  trigger,
  onSaved,
}: {
  account?: Account;
  trigger?: React.ReactNode;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center justify-center h-7 px-2.5 rounded-md text-xs font-semibold text-gray-600 hover:text-[#F15A22] hover:bg-[#FEF0EB] border border-gray-200 hover:border-[#FBD9C9] transition-colors"
          >
            Edit
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="px-6 py-6 border-b shrink-0">
          <SheetTitle>{account ? 'Edit Account' : 'Add Account'}</SheetTitle>
          <SheetDescription>
            {account
              ? `Update details for ${account.name}.`
              : 'Create a new client account. You can also add a primary contact in one step.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-2 relative h-full">
          <AccountForm
            initialData={
              account
                ? {
                  id: account.id,
                  name: account.name,
                  industry: account.industry || '',
                  size: account.size || '',
                  website: account.website || '',
                  status: (account.status as 'prospect' | 'active' | 'inactive') || 'prospect',
                }
                : undefined
            }
            onSuccess={() => {
              setOpen(false);
              onSaved();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
