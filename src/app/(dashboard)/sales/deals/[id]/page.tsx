'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ActivityList } from '@/components/crm/activity-list';
import { DollarSign, Percent, History, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DealDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [deal, setDeal] = useState<any>(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dealRes, actRes] = await Promise.all([
          fetch(`/api/deals/${id}`),
          fetch(`/api/activities?relatedId=${id}&relatedType=deal`),
        ]);
        
        const dealData = await dealRes.json();
        const actData = await actRes.json();

        setDeal(dealData.data);
        if (actData.data) setActivities(actData.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  const handleCloseDeal = async (status: 'won' | 'lost') => {
    const reason = prompt(`Please enter a reason for why this deal was ${status}:`);
    if (!reason) return; // cancelled or empty

    setIsClosing(true);
    try {
      const res = await fetch(`/api/deals/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });
      if (!res.ok) throw new Error('Failed to close deal');
      toast.success(`Deal marked as Closed ${status.toUpperCase()}!`);
      
      if (status === 'won') {
        // Optional: redirect to projects page
        router.push(`/projects`);
      } else {
        router.refresh(); // just reload UI
      }
    } catch (e: any) {
      toast.error(e.message || 'Error closing deal');
    } finally {
      setIsClosing(false);
    }
  };

  const handleActivityToggle = async (activityId: string, newStatus: string) => {
    // Optimistic update
    setActivities(current => current.map((a: any) => a.id === activityId ? { ...a, status: newStatus } : a) as any);
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update activity');
    } catch (e: any) {
      toast.error('Failed to update activity status');
      // Revert would go here, but omitted for brevity
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading deal details...</div>;
  if (!deal) return <div className="p-8 text-center text-destructive">Deal not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={deal.name}
        description={`${deal.account?.name || 'No Account'} • Stage: ${deal.stage.toUpperCase()}`}
      >
        <div className="space-x-2">
          {deal.status === 'open' && (
            <>
              <Button variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200" onClick={() => handleCloseDeal('won')} disabled={isClosing}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Won
              </Button>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleCloseDeal('lost')} disabled={isClosing}>
                <XCircle className="w-4 h-4 mr-2" /> Lost
              </Button>
            </>
          )}
          {deal.status !== 'open' && (
            <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${deal.status === 'won' ? 'bg-emerald-100 text-emerald-800' : 'bg-destructive/10 text-destructive'}`}>
              Closed {deal.status.toUpperCase()}
            </span>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 flex items-center space-x-4">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD' }).format(deal.amount)}</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Probability</p>
            <p className="font-semibold">{deal.probability}%</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Days in Stage</p>
            <p className="font-semibold">{deal.health?.daysInStage || 0} days</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Stage History</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="bg-card border rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Expected Close Date</p>
                <p className="font-medium">{deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), 'MMMM d, yyyy') : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Lead Source</p>
                <p className="font-medium">{deal.source || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Owner</p>
                <p className="font-medium">{deal.ownerId || 'Unassigned'}</p>
              </div>
              {deal.status !== 'open' && (
                <div className="col-span-2 mt-4 p-4 bg-muted/30 rounded-md">
                  <p className="text-muted-foreground mb-1">Closed Reason</p>
                  <p className="font-medium text-foreground">{deal.winLossReason || 'No reason provided.'}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-card border rounded-lg p-6">
            {deal.history && deal.history.length > 0 ? (
              <div className="relative border-l border-border ml-4 space-y-6 pb-4">
                {deal.history.map((h: any, idx: number) => (
                  <div key={h.id} className="relative pl-6">
                    <div className={`absolute -left-2 top-1 w-4 h-4 rounded-full border bg-background ${idx === 0 ? 'border-primary border-4' : 'border-muted-foreground'}`}></div>
                    <div>
                      <p className="font-medium capitalize">{h.toStage} <span className="font-normal text-muted-foreground text-sm lowercase">from {h.fromStage || 'creation'}</span></p>
                      <time className="text-xs text-muted-foreground">{format(new Date(h.changedAt), 'MMM d, yyyy h:mm a')}</time>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm">No stage history available.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quotes">
          <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground text-sm">
            <p>No quotes generated for this deal yet.</p>
            <Button variant="outline" className="mt-4">Create Quote</Button>
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <ActivityList activities={activities} onStatusToggle={handleActivityToggle} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
