'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil } from 'lucide-react';
import {
  CrmTable,
  CrmStageBadge,
  CrmDealStatusBadge,
  CrmHealthBadge,
  CrmSearchBar,
  CrmPagination,
  CrmEmptyState,
  CrmToolbar,
  CrmSection,
  type CrmTableColumn,
} from '@/components/crm/crm-shell';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { DealForm } from '@/components/sales/deal-form';

type Deal = {
  id: string;
  name: string;
  accountId: string;
  amount: string | number;
  currency: string;
  stage: string;
  probability: string | number;
  expectedCloseDate?: string | null;
  source?: string | null;
  status: string;
  health?: {
    daysInStage?: number;
    riskFlag?: boolean;
    history?: Array<{ id?: string; fromStage?: string | null; toStage?: string }>;
  };
};

export function DealTable({ deals }: { deals: Deal[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const q = search.trim().toLowerCase();
  const filtered = deals.filter(d =>
    !q ||
    d.name?.toLowerCase().includes(q) ||
    d.stage?.toLowerCase().includes(q) ||
    d.source?.toLowerCase().includes(q)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns: CrmTableColumn<Deal>[] = [
    {
      id: 'name',
      header: 'Deal',
      cell: (d: Deal) => (
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{d.name}</div>
          <div className="text-[11px] text-gray-400 truncate">
            {d.source ? `Source · ${d.source}` : '—'}
          </div>
        </div>
      ),
    },
    {
      id: 'stage',
      header: 'Stage',
      cell: (d: Deal) => <CrmStageBadge stage={d.stage} />,
      width: 'w-[150px]',
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (d: Deal) => (
        <CurrencyDisplay
          amount={parseFloat(String(d.amount || '0')) || 0}
          className="!text-[14px]"
        />
      ),
      width: 'w-[160px]',
    },
    {
      id: 'probability',
      header: 'Probability',
      align: 'right',
      cell: (d: Deal) => {
        const p = Math.round(parseFloat(String(d.probability || '0')) || 0);
        return (
          <div className="inline-flex flex-col items-end gap-1 min-w-[80px]">
            <span className="text-xs font-semibold text-gray-700 tabular-nums">{p}%</span>
            <div className="h-1 w-16 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F15A22]"
                style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
              />
            </div>
          </div>
        );
      },
      width: 'w-[120px]',
      hideOn: 'sm',
    },
    {
      id: 'closeDate',
      header: 'Close Date',
      cell: (d: Deal) =>
        d.expectedCloseDate ? (
          <span className="text-sm text-gray-700">
            {format(new Date(d.expectedCloseDate), 'MMM d, yyyy')}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      hideOn: 'md',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (d: Deal) => (
        <div className="flex flex-col items-start gap-1">
          <CrmDealStatusBadge status={d.status} />
          <CrmHealthBadge risk={d.health?.riskFlag} className="text-[9px] px-1.5 py-0" />
        </div>
      ),
      width: 'w-[140px]',
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-[80px]',
      cell: (d: Deal) => (
        <DealRowSheet deal={d} />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <CrmSection
        actions={
          <CrmToolbar>
            <CrmSearchBar
              value={search}
              onChange={v => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search deals…"
            />
          </CrmToolbar>
        }
      >
        <CrmTable
          columns={columns}
          rows={rows}
          rowKey={r => r.id}
          emptyState={
            <CrmEmptyState
              icon={<Pencil />}
              title={q ? 'No matching deals' : 'No deals yet'}
              description={q ? 'Try a different search term.' : 'Create your first deal to populate the pipeline.'}
            />
          }
        />
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <CrmPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </CrmSection>
    </div>
  );
}

function DealRowSheet({ deal, onSaved }: { deal: Deal; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:text-[#DC2626] hover:bg-[#FEF2F2] border border-gray-200 hover:border-[#FECACA] transition-colors"
          aria-label="Edit deal"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="px-6 py-6 border-b shrink-0">
          <SheetTitle>Edit Deal</SheetTitle>
          <SheetDescription>
            Update details for {deal.name}.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-2 relative h-full">
          <DealForm
            initialData={{
              id: deal.id,
              name: deal.name,
              accountId: deal.accountId,
              amount: String(deal.amount ?? ''),
              currency: deal.currency,
              expectedCloseDate: deal.expectedCloseDate
                ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
                : '',
              source: deal.source || '',
            }}
            onSuccess={() => {
              setOpen(false);
              onSaved?.();
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
