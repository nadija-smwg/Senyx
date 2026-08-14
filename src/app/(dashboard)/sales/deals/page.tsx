'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/sales/kanban-board';
import { DealTable } from '@/components/sales/deal-table';
import { LayoutDashboard, List, DollarSign, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DealForm } from '@/components/sales/deal-form';
import { CurrencyDisplay } from '@/components/ui/currency-display';

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [metrics, setMetrics] = useState({
    totalValue: 0,
    weightedValue: 0,
    winRate: 0,
    atRisk: 0,
  });

  async function fetchDeals() {
    try {
      const res = await fetch('/api/deals?scope=all');
      const d = await res.json();
      if (d.data) {
        setDeals(d.data);
        calculateMetrics(d.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function calculateMetrics(data: any[]) {
    let total = 0;
    let weighted = 0;
    let won = 0;
    let lost = 0;
    let risk = 0;

    data.forEach(deal => {
      const amt = parseFloat(deal.amount || '0');
      const prob = parseFloat(deal.probability || '0');
      
      if (deal.status === 'open') {
        total += amt;
        weighted += (amt * prob) / 100;
        if (deal.health?.riskFlag) risk += 1;
      } else if (deal.status === 'won') {
        won += 1;
      } else if (deal.status === 'lost') {
        lost += 1;
      }
    });

    setMetrics({
      totalValue: total,
      weightedValue: weighted,
      winRate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0,
      atRisk: risk,
    });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeals();
  }, []);


  const handleStageChange = async (dealId: string, newStage: string) => {
    // Optimistic update
    setDeals(current => current.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    
    try {
      const res = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStage })
      });
      
      if (!res.ok) throw new Error('Failed to change stage');
      
      // Refresh to get actual calculated probabilities
      fetchDeals();
      toast.success('Deal stage updated');
    } catch (e: any) {
      toast.error('Failed to update stage');
      fetchDeals(); // Revert
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Pipeline" 
        description="Manage your active deals and forecast revenue."
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-muted p-1 rounded-md">
            <Button 
              variant={viewMode === 'board' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="px-3"
              onClick={() => setViewMode('board')}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" /> Board
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm"
              className="px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" /> List
            </Button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Create Deal</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold font-heading">Create Deal</SheetTitle>
              </SheetHeader>
              <DealForm onSuccess={() => fetchDeals()} />
            </SheetContent>
          </Sheet>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={metrics.totalValue} /></div>
            <p className="text-xs text-muted-foreground mt-1">Open deals value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={metrics.weightedValue} /></div>
            <p className="text-xs text-muted-foreground mt-1">Expected revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.winRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Historical closed-won</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Deals</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.atRisk}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading pipeline...</div>
      ) : viewMode === 'board' ? (
        <KanbanBoard deals={deals.filter(d => d.status === 'open')} onStageChange={handleStageChange} />
      ) : (
        <DealTable deals={deals} />
      )}
    </div>
  );
}
