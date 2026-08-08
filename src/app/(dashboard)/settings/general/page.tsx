'use client';
import { PageHeader } from '../../../../components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Switch } from '../../../../components/ui/switch';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function GeneralSettingsPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reminder-schedules')
      .then(res => res.json())
      .then(data => {
        if (data.data) setSchedules(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSchedule = async (id: string, payload: any) => {
    try {
      const res = await fetch(`/api/reminder-schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Schedule updated');
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...payload } : s));
      } else {
        toast.error('Failed to update schedule');
      }
    } catch (e) {
      toast.error('Failed to update schedule');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="General Settings" description="Global platform configurations.">
        <Button onClick={() => toast.success('Configuration saved')}>Save Configuration</Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Basic information used across the platform and invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" defaultValue="SENYX Corporation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Input id="currency" defaultValue="USD" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminders & Notifications</CardTitle>
          <CardDescription>Configure background jobs and automated notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!loading && schedules.map(schedule => (
            <div key={schedule.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{schedule.name}</h4>
                  <p className="text-sm text-muted-foreground">Target: {schedule.target.replace('_', ' ')}</p>
                </div>
                <Switch 
                  checked={schedule.isActive} 
                  onCheckedChange={(val) => updateSchedule(schedule.id, { isActive: val })} 
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Advance Warning Days (comma separated)</Label>
                  <div className="flex space-x-2">
                    <Input 
                      defaultValue={schedule.advanceDays} 
                      onBlur={(e) => updateSchedule(schedule.id, { advanceDays: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Digest Send Time (UTC)</Label>
                  <div className="flex space-x-2">
                    <Input 
                      type="time"
                      defaultValue={schedule.digestTime || '08:00'} 
                      onBlur={(e) => updateSchedule(schedule.id, { digestTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && <p className="text-sm text-muted-foreground">Loading schedules...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
