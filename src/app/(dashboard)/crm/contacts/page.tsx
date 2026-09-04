'use client';

import { useEffect, useMemo, useState } from 'react';
import { Contact2, Mail, Phone, Plus, Star, Users } from 'lucide-react';
import {
  CrmPageShell,
  CrmSearchBar,
  CrmStatCard,
  CrmTable,
  CrmAvatar,
  CrmNameCell,
  CrmEmptyState,
  CrmToolbar,
  CrmPagination,
  CrmErrorState,
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
import { ContactForm } from '@/components/crm/contact-form';

type Contact = {
  id: string;
  accountId: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  isPrimary?: boolean | null;
};

type Account = { id: string; name: string };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [cRes, aRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/accounts'),
      ]);
      const cJson = await cRes.json();
      const aJson = await aRes.json();
      if (!cRes.ok) throw new Error(cJson?.error?.message || 'Failed to load contacts');
      setContacts(Array.isArray(cJson.data) ? (cJson.data as Contact[]) : []);
      setAccounts(Array.isArray(aJson.data) ? (aJson.data as Account[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  const accountName = useMemo(() => {
    const m = new Map<string, string>();
    accounts.forEach(a => m.set(a.id, a.name));
    return m;
  }, [accounts]);

  const fullName = (c: Contact) => `${c.firstName} ${c.lastName ?? ''}`.trim();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter(c => {
      const matchSearch =
        !q ||
        fullName(c).toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        accountName.get(c.accountId)?.toLowerCase().includes(q);
      const matchAccount = accountFilter === 'all' || c.accountId === accountFilter;
      return matchSearch && matchAccount;
    });
  }, [contacts, search, accountFilter, accountName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const counts = useMemo(() => {
    const total = contacts.length;
    const primary = contacts.filter(c => c.isPrimary).length;
    const withEmail = contacts.filter(c => !!c.email).length;
    const accountsCount = new Set(contacts.map(c => c.accountId)).size;
    return { total, primary, withEmail, accountsCount };
  }, [contacts]);

  const columns: CrmTableColumn<Contact>[] = [
    {
      id: 'name',
      header: 'Contact',
      cell: c => (
        <div className="flex items-center gap-2 min-w-0">
          <CrmAvatar name={fullName(c)} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {fullName(c) || c.email || 'Unnamed'}
              </span>
              {c.isPrimary && (
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" aria-label="Primary contact" />
              )}
            </div>
            <div className="text-[11px] text-gray-400 truncate">{c.title || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'account',
      header: 'Account',
      cell: (c: Contact) =>
        accountName.get(c.accountId) ? (
          <CrmNameCell
            name={accountName.get(c.accountId)}
            avatar={
              <span className="h-7 w-7 rounded-md bg-[#FEF0EB] text-[#F15A22] text-[11px] font-bold flex items-center justify-center border border-[#FBD9C9]">
                {(accountName.get(c.accountId) || '?').slice(0, 2).toUpperCase()}
              </span>
            }
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      id: 'email',
      header: 'Email',
      cell: (c: Contact) =>
        c.email ? (
          <a
            href={`mailto:${c.email}`}
            className="inline-flex items-center gap-1 text-sm text-[#1A6DB6] hover:underline truncate max-w-[220px]"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{c.email}</span>
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      hideOn: 'md',
    },
    {
      id: 'phone',
      header: 'Phone',
      cell: (c: Contact) =>
        c.phone ? (
          <a
            href={`tel:${c.phone}`}
            className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-[#1A6DB6] truncate max-w-[160px]"
          >
            <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{c.phone}</span>
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      hideOn: 'sm',
    },
    {
      id: 'primary',
      header: 'Role',
      cell: (c: Contact) =>
        c.isPrimary ? (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            Primary
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      width: 'w-[120px]',
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-[100px]',
      cell: (c: Contact) => <ContactEditSheet contact={c} onSaved={loadAll} />,
    },
  ];

  return (
    <CrmPageShell
      pretitle="CRM"
      title="Contacts"
      description="People linked to your client accounts. Mark primary contacts and keep contact info current."
      actions={
        <ContactEditSheet
          trigger={
            <Button className="gap-1.5 bg-[#F15A22] hover:bg-[#C9471A] text-white shadow-sm">
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          }
          onSaved={loadAll}
        />
      }
      stats={
        <>
          <CrmStatCard
            label="Total Contacts"
            value={counts.total}
            icon={<Contact2 />}
            hint="Across all accounts"
          />
          <CrmStatCard
            label="Primary"
            value={counts.primary}
            icon={<Star />}
            accent="warning"
            hint="Main point of contact"
          />
          <CrmStatCard
            label="With Email"
            value={counts.withEmail}
            icon={<Mail />}
            accent="info"
            hint="Reachable by email"
          />
          <CrmStatCard
            label="Accounts Covered"
            value={counts.accountsCount}
            icon={<Users />}
            accent="positive"
            hint="Distinct companies"
          />
        </>
      }
      toolbar={
        <CrmToolbar>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={accountFilter}
              onChange={e => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#F15A22] focus:ring-2 focus:ring-[#F15A22]/20"
            >
              <option value="all">All accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <CrmSearchBar
            value={search}
            onChange={v => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name, email, title…"
          />
        </CrmToolbar>
      }
    >
      {error ? (
        <CrmErrorState
          title="Couldn't load contacts"
          message={error}
          onRetry={loadAll}
        />
      ) : (
        <>
          <CrmTable
            columns={columns}
            rows={pageRows}
            rowKey={r => r.id}
            loading={loading}
            emptyState={
              <CrmEmptyState
                icon={<Contact2 />}
                title={search || accountFilter !== 'all' ? 'No matching contacts' : 'No contacts yet'}
                description={
                  search || accountFilter !== 'all'
                    ? 'Try a different search term or remove filters.'
                    : 'Add a contact from any account to start building your CRM.'
                }
                action={
                  !search && accountFilter === 'all' && accounts.length > 0 ? (
                    <ContactEditSheet
                      trigger={
                        <Button className="gap-1.5 bg-[#F15A22] hover:bg-[#C9471A] text-white">
                          <Plus className="w-4 h-4" />
                          Add Contact
                        </Button>
                      }
                      onSaved={loadAll}
                    />
                  ) : (
                    !search && accountFilter === 'all' && (
                      <p className="text-xs text-gray-400">Create an account first to add contacts.</p>
                    )
                  )
                }
              />
            }
          />
          <div className="pt-3">
            <CrmPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </CrmPageShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact edit / add sheet                                            */
/* ------------------------------------------------------------------ */

function ContactEditSheet({
  contact,
  trigger,
  onSaved,
}: {
  contact?: Contact;
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
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{contact ? 'Edit Contact' : 'Add Contact'}</SheetTitle>
          <SheetDescription>
            {contact
              ? `Update details for ${contact.firstName} ${contact.lastName ?? ''}`.trim()
              : 'Link a new person to one of your client accounts.'}
          </SheetDescription>
        </SheetHeader>
        <ContactForm
          initialData={
            contact
              ? {
                id: contact.id,
                accountId: contact.accountId,
                firstName: contact.firstName,
                lastName: contact.lastName || '',
                email: contact.email || '',
                phone: contact.phone || '',
                title: contact.title || '',
                isPrimary: !!contact.isPrimary,
              }
              : undefined
          }
          onSuccess={() => {
            setOpen(false);
            onSaved();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
