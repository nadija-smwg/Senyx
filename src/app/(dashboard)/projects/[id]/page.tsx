'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { Loader2, DollarSign, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ProjectOverviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/projects/${id}/summary`);
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) {
    return <div>Failed to load project summary.</div>;
  }

  const { boardStatus, timeLogged, financials } = data;
  
  // Calculate total tasks for completion %
  const totalTasks = boardStatus.reduce((sum: number, c: any) => sum + c.count, 0);
  const doneCol = boardStatus.find((c: any) => c.name === 'Done');
  const completedTasks = doneCol ? doneCol.count : 0;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPct}%</div>
            <Progress value={completionPct} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeLogged.totalHours} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeLogged.billableHours} hrs billable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financials.collected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Budget: ${financials.budget.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financials.due.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending collection
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Board Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {boardStatus.map((status: any) => (
                <div key={status.name} className="flex items-center">
                  <div className="w-32 text-sm font-medium">{status.name}</div>
                  <div className="flex-1 ml-4">
                    <Progress value={totalTasks > 0 ? (status.count / totalTasks) * 100 : 0} />
                  </div>
                  <div className="ml-4 w-8 text-right text-sm text-muted-foreground">
                    {status.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
