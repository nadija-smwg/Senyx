'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CreateContactDialog } from '@/components/crm/create-contact-dialog';
import { InteractionTimeline } from '@/components/crm/interaction-timeline';
import { ActivityList } from '@/components/crm/activity-list';
import { Building2, Globe, Users, Briefcase } from 'lucide-react';

export default function AccountDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [account, setAccount] = useState<any>(null);
  const [interactions, setInteractions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);

  const refreshAccount = () => {
    if (!id) return;
    fetch(`/api/accounts/${id}`)
      .then(res => res.json())
      .then(data => setAccount(data.data))
      .catch(console.error);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [accRes, intRes, actRes] = await Promise.all([
          fetch(`/api/accounts/${id}`),
          fetch(`/api/interactions?accountId=${id}`),
          fetch(`/api/activities?relatedId=${id}&relatedType=account`),
        ]);
        
        const accData = await accRes.json();
        const intData = await intRes.json();
        const actData = await actRes.json();

        setAccount(accData.data);
        if (intData.data) setInteractions(intData.data);
        if (actData.data) setActivities(actData.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading account details...</div>;
  if (!account) return <div className="p-8 text-center text-destructive">Account not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={account.name}
        description={`${account.industry || 'No Industry'} • ${account.status}`}
      >
        <div className="space-x-2">
          <Button variant="outline">Edit Account</Button>
          <Button>Log Interaction</Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({account.contacts?.length || 0})</TabsTrigger>
          <TabsTrigger value="interactions">Interactions ({interactions.length})</TabsTrigger>
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-primary" />
                Company Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Industry</p>
                  <p className="font-medium">{account.industry || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium">{account.size || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Website</p>
                  <p className="font-medium">
                    {account.website ? <a href={account.website} target="_blank" className="text-blue-500 hover:underline">{account.website}</a> : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{account.status}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-muted/20">
              <h3 className="font-semibold flex items-center">
                <Users className="w-4 h-4 mr-2" /> Contacts
              </h3>
              <Button size="sm" variant="outline" onClick={() => setIsCreateContactOpen(true)}>Add Contact</Button>
            </div>
            {account.contacts && account.contacts.length > 0 ? (
              <ul className="divide-y divide-border">
                {account.contacts.map((c: any) => (
                  <li key={c.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
                    <div>
                      <p className="font-medium">{c.firstName} {c.lastName} {c.isPrimary && <span className="ml-2 text-[10px] uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">Primary</span>}</p>
                      <p className="text-sm text-muted-foreground">{c.title || 'No title'} • {c.email || 'No email'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No contacts linked to this account.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="interactions">
          <InteractionTimeline interactions={interactions} />
        </TabsContent>

        <TabsContent value="activities">
          <ActivityList activities={activities} />
        </TabsContent>
      </Tabs>

      <CreateContactDialog 
        open={isCreateContactOpen} 
        onOpenChange={setIsCreateContactOpen} 
        onSuccess={refreshAccount}
        defaultAccountId={id}
      />
    </div>
  );
}
