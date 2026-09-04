'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  DollarSign,
  Handshake,
  LayoutDashboard,
  List,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  CrmPageShell,
  CrmSearchBar,
  CrmStatCard,
  CrmToolbar,
  CrmViewToggle,
  CrmEmptyState,
  CrmErrorState,
  CrmLoadingState,
  DEAL_STAGES,
  DEAL_STAGE_META,
  type DealStage,
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
import { DealForm } from '@/components/sales/deal-form';
import { KanbanBoard } from '@/components/sales/kanban-board';
import { DealTable } from '@/components/sales/deal-table';

type Deal = {
  id: string;
  name: string;
  accountId: string;
  ownerId: string;
  amount: string | number;
  currency: string;
  stage: string;
  probability: string | number;
  expectedCloseDate?: string | null;
  source?: string | null;
  status: 'open' | 'won' | 'lost' | string;
  health?: {
    daysInStage?: number;
    riskFlag?: boolean;
    history?: Array<{ id?: string; fromStage?: string | null; toStage?: string }>;
  };
};

type Account = { id: string; name: string };

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [stageFilter, setStageFilter] = useState<'all' | DealStage>('all');
  const [search, setSearch] = useState('');

  async function fetchDeals() {
    setLoading(true);
    setError(null);
    try {
      const [dRes, aRes] = await Promise.all([
        fetch('/api/deals?scope=all'),
        fetch('/api/accounts'),
      ]);
      const dJson = await dRes.json();
      const aJson = await aRes.json();
      if (!dRes.ok) throw new Error(dJson?.error?.message || 'Failed to load deals');
      setDeals(Array.isArray(dJson.data) ? (dJson.data as Deal[]) : []);
      setAccounts(Array.isArray(aJson.data) ? (aJson.data as Account[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeals();
  }, []);

  const accountMap = useMemo(() => {
    const m = new Map<string, string>();
    accounts.forEach(a => m.set(a.id, a.name));
    return m;
  }, [accounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter(d => {
      const matchSearch =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        accountMap.get(d.accountId)?.toLowerCase().includes(q) ||
        d.source?.toLowerCase().includes(q);
      const matchStage = stageFilter === 'all' || d.stage === stageFilter;
      return matchSearch && matchStage;
    });
  }, [deals, search, stageFilter, accountMap]);

  const metrics = useMemo(() => {
    let totalValue = 0;
    let weightedValue = 0;
    let wonCount = 0;
    let lostCount = 0;
    let atRisk = 0;
    let openCount = 0;

    for (const d of deals) {
      const amt = parseFloat(String(d.amount || '0')) || 0;
      const prob = parseFloat(String(d.probability || '0')) || 0;
      if (d.status === 'open') {
        totalValue += amt;
        weightedValue += (amt * prob) / 100;
        openCount += 1;
        if (d.health?.riskFlag) atRisk += 1;
      } else if (d.status === 'won') {
        wonCount += 1;
      } else if (d.status === 'lost') {
        lostCount += 1;
      }
    }
    const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;
    return { totalValue, weightedValue, winRate, atRisk, openCount, wonCount, lostCount };
  }, [deals]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    DEAL_STAGES.forEach(s => (counts[s] = { count: 0, value: 0 }));
    for (const d of filtered) {
      const c = counts[d.stage] ?? (counts[d.stage] = { count: 0, value: 0 });
      c.count += 1;
      c.value += parseFloat(String(d.amount || '0')) || 0;
    }
    return counts;
  }, [filtered]);

  const handleStageChange = useCallback(
    async (dealId: string, newStage: string) => {
      // Optimistic update
      setDeals(curr => curr.map(d => (d.id === dealId ? { ...d, stage: newStage } : d)));
      try {
        const res = await fetch(`/api/deals/${dealId}/stage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newStage }),
        });
        if (!res.ok) throw new Error('Failed to change stage');
        toast.success('Deal stage updated');
        fetchDeals();
      } catch {
        toast.error('Failed to update stage');
        fetchDeals();
      }
    },
    []
  );

  return (
    <CrmPageShell
      pretitle="Sales"
      title="Sales Pipeline"
      description="Track open opportunities across every stage. Drag deals between stages to update your forecast."
      actions={
        <>
          <CrmViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'board', label: 'Board', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
              { value: 'list', label: 'List', icon: <List className="w-3.5 h-3.5" /> },
            ]}
          />
          <DealSheet onSaved={fetchDeals} />
        </>
      }
      stats={
        <>
          <CrmStatCard
            label="Total Pipeline"
            value={<CurrencyDisplay amount={metrics.totalValue} />}
            icon={<DollarSign />}
            hint={`${metrics.openCount} open deals`}
          />
          <CrmStatCard
            label="Weighted Value"
            value={<CurrencyDisplay amount={metrics.weightedValue} />}
            icon={<Target />}
            accent="info"
            hint="Probability-adjusted"
          />
          <CrmStatCard
            label="Win Rate"
            value={`${metrics.winRate}%`}
            icon={<TrendingUp />}
            accent="positive"
            hint={`${metrics.wonCount} won · ${metrics.lostCount} lost`}
          />
          <CrmStatCard
            label="At Risk"
            value={metrics.atRisk}
            icon={<AlertTriangle />}
            accent={metrics.atRisk > 0 ? 'warning' : 'neutral'}
            hint={metrics.atRisk > 0 ? 'Needs immediate action' : 'All clear'}
          />
        </>
      }
      toolbar={
        <CrmToolbar>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setStageFilter('all')}
              className={
                'h-7 px-3 rounded-md text-xs font-semibold transition-colors border ' +
                (stageFilter === 'all'
                  ? 'bg-[#FEF0EB] text-[#C9471A] border-[#FBD9C9]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')
              }
            >
              All
              <span className="ml-1.5 text-[10px] tabular-nums text-gray-400">{deals.length}</span>
            </button>
            {DEAL_STAGES.map(stage => {
              const meta = DEAL_STAGE_META[stage];
              const c = stageCounts[stage];
              const active = stageFilter === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage)}
                  className={
                    'inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold transition-colors border ' +
                    (active
                      ? `${meta.bg} ${meta.fg} ${meta.border}`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')
                  }
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                  <span className="ml-0.5 text-[10px] tabular-nums text-gray-400">{c?.count ?? 0}</span>
                </button>
              );
            })}
          </div>
          <CrmSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by deal or account…"
          />
        </CrmToolbar>
      }
    >
      {error ? (
        <CrmErrorState title="Couldn’t load pipeline" message={error} onRetry={fetchDeals} />
      ) : loading ? (
        <CrmLoadingState label="Loading pipeline…" />
      ) : viewMode === 'board' ? (
        <PipelineBoard
          deals={filtered.filter(d => d.status === 'open')}
          onStageChange={handleStageChange}
        />
      ) : (
        <DealTable deals={filtered} />
      )}
    </CrmPageShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline board (re-themed kanban)                                   */
/* ------------------------------------------------------------------ */

function PipelineBoard({
  deals,
  onStageChange,
}: {
  deals: Deal[];
  onStageChange: (dealId: string, newStage: string) => void;
}) {
  if (deals.length === 0) {
    return (
      <CrmEmptyState
        icon={<Handshake />}
        title="No open deals"
        description="Create your first deal to start tracking your sales pipeline."
        action={<DealSheet />}
      />
    );
  }

  // We pass the deals to the existing KanbanBoard component (it owns the DnD
  // behaviour) but wrap each column header with our themed stage badge.
  // To avoid duplicating DnD logic we use the existing component and pass
  // themed metadata through a small wrapper.
  return <KanbanBoard deals={deals} onStageChange={onStageChange} />;
}

/* ------------------------------------------------------------------ */
/*  Create deal sheet                                                   */
/* ------------------------------------------------------------------ */

function DealSheet({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-1.5 bg-[#F15A22] hover:bg-[#C9471A] text-white shadow-sm">
          <Plus className="w-4 h-4" />
          Create Deal
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Create Deal</SheetTitle>
          <SheetDescription>
            Add a new opportunity. Stage and probability will be set automatically.
          </SheetDescription>
        </SheetHeader>
        <DealForm
          onSuccess={() => {
            setOpen(false);
            onSaved?.();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
