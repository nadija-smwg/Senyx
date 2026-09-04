'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Calendar, Pencil } from 'lucide-react';
import {
  CrmTable,
  CrmSearchBar,
  CrmToolbar,
  CrmPagination,
  CrmEmptyState,
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
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { ProjectForm } from '@/components/projects/project-form';
import {
  ProjectStatusBadge,
  ProjectTypeBadge,
  ProjectProgressBar,
  computeProgress,
  formatProjectDateRange,
} from '@/components/projects/project-shell';

export type Project = {
  id: string;
  code: string;
  name: string;
  type?: string | null;
  status: string;
  budget?: string | number | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  ownerId?: string | null;
  accountId?: string | null;
  billingType?: string | null;
  createdAt?: string;
};

type Account = { id: string; name: string };

export function ProjectsTable({
  projects: initialProjects,
  accounts = [],
}: {
  projects?: Project[];
  accounts?: Account[];
}) {
  const [fetchedProjects, setFetchedProjects] = React.useState<Project[] | null>(null);
  const [fetchedAccounts, setFetchedAccounts] = React.useState<Account[] | null>(null);
  const [loading, setLoading] = React.useState(!initialProjects);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'>('all');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const router = useRouter();

  // Use the parent's data when provided, otherwise fall back to the
  // locally fetched copy (so the component still works in standalone use).
  const data: Project[] = React.useMemo(
    () => initialProjects ?? fetchedProjects ?? [],
    [initialProjects, fetchedProjects]
  );
  const accountsState: Account[] = React.useMemo(
    () => (initialProjects ? accounts : (fetchedAccounts ?? [])),
    [initialProjects, accounts, fetchedAccounts]
  );

  const refetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch('/api/projects?scope=all'),
        fetch('/api/accounts'),
      ]);
      const pJson = await pRes.json();
      const aJson = await aRes.json();
      if (!pRes.ok) throw new Error(pJson?.error?.message || 'Failed to load projects');
      setFetchedProjects(Array.isArray(pJson.data) ? (pJson.data as Project[]) : []);
      setFetchedAccounts(Array.isArray(aJson.data) ? (aJson.data as Account[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialProjects) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [initialProjects, refetch]);

  const accountName = React.useCallback(
    (id?: string | null) => (id ? accountsState.find(a => a.id === id)?.name : undefined),
    [accountsState]
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter(p => {
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        accountName(p.accountId)?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter, accountName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns: CrmTableColumn<Project>[] = [
    {
      id: 'project',
      header: 'Project',
      cell: (p: Project) => (
        <button
          type="button"
          onClick={() => router.push(`/projects/${p.id}`)}
          className="flex items-center gap-2.5 text-left group min-w-0"
        >
          <span className="h-9 w-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center border border-[#A7F3D0] shrink-0 [&_svg]:w-4 [&_svg]:h-4">
            <Pencil className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#059669]">
              {p.name}
            </div>
            <div className="text-[11px] text-gray-400 font-mono truncate">{p.code}</div>
          </div>
        </button>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (p: Project) => <ProjectStatusBadge status={p.status} />,
      width: 'w-[140px]',
    },
    {
      id: 'type',
      header: 'Type',
      cell: (p: Project) => <ProjectTypeBadge type={p.type} />,
      hideOn: 'sm',
    },
    {
      id: 'account',
      header: 'Account',
      cell: (p: Project) =>
        accountName(p.accountId) ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 truncate max-w-[220px]">
            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{accountName(p.accountId)}</span>
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      hideOn: 'md',
    },
    {
      id: 'budget',
      header: 'Budget',
      align: 'right',
      cell: (p: Project) =>
        p.budget ? (
          <CurrencyDisplay
            amount={parseFloat(String(p.budget)) || 0}
            className="!text-[13px]"
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      hideOn: 'sm',
    },
    {
      id: 'timeline',
      header: 'Timeline',
      cell: (p: Project) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 truncate max-w-[200px]">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{formatProjectDateRange(p.startDate, p.endDate)}</span>
        </span>
      ),
      hideOn: 'md',
    },
    {
      id: 'progress',
      header: 'Progress',
      cell: (p: Project) => {
        const progress = computeProgress(p.startDate, p.endDate);
        if (progress === null) {
          return <span className="text-xs text-gray-400">—</span>;
        }
        const overdue = progress >= 100 && p.status !== 'completed' && p.status !== 'cancelled';
        return (
          <div className="flex items-center gap-2 w-[140px]">
            <ProjectProgressBar percent={progress} status={p.status} className="flex-1" />
            <span
              className={
                'text-xs tabular-nums font-semibold ' +
                (overdue ? 'text-rose-600' : 'text-gray-600')
              }
            >
              {progress}%
            </span>
          </div>
        );
      },
      width: 'w-[170px]',
      hideOn: 'sm',
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-[80px]',
      cell: (p: Project) => (
        <div className="flex items-center justify-end gap-1.5">
          <ProjectEditSheet project={p} onSaved={refetch} />
        </div>
      ),
    },
  ];

  if (error) {
    return <CrmErrorState title="Couldn't load projects" message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-3">
      <CrmToolbar>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'planning', 'active', 'on_hold', 'completed', 'cancelled'] as const).map(s => (
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
                  ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')
              }
            >
              {s === 'all' ? 'All' : s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 text-[10px] tabular-nums text-gray-400">
                {s === 'all' ? data.length : data.filter(p => p.status === s).length}
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
          placeholder="Search by name, code or account…"
        />
      </CrmToolbar>

      <CrmTable
        columns={columns}
        rows={pageRows}
        rowKey={r => r.id}
        loading={loading}
        emptyState={
          <CrmEmptyState
            icon={<Pencil />}
            title={search || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
            description={
              search || statusFilter !== 'all'
                ? 'Try a different search term or remove filters.'
                : 'Create your first project to start tracking work.'
            }
          />
        }
      />

      {totalPages > 1 && (
        <div className="pt-2">
          <CrmPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Edit / create project sheet (delegates to existing ProjectForm)      */
/* ------------------------------------------------------------------ */

function ProjectEditSheet({
  project,
  onSaved,
}: {
  project?: Project;
  onSaved: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {project ? (
          <button
            type="button"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:text-[#059669] hover:bg-[#ECFDF5] border border-gray-200 hover:border-[#A7F3D0] transition-colors"
            aria-label="Edit project"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Button className="gap-1.5 bg-[#059669] hover:bg-[#047857] text-white shadow-sm">
            Add Project
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{project ? 'Edit Project' : 'Create Project'}</SheetTitle>
          <SheetDescription>
            {project
              ? `Update details for ${project.name}.`
              : 'Create a new project. Default board columns and your assignment are added automatically.'}
          </SheetDescription>
        </SheetHeader>
        <ProjectForm
          onSuccess={() => {
            setOpen(false);
            onSaved();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

export { ProjectEditSheet };
