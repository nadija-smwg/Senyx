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
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/reminder-schedules').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]).then(([schedData, settingsData]) => {
      if (schedData.data) setSchedules(schedData.data);
      if (settingsData.data) {
        const cName = settingsData.data.find((s: any) => s.key === 'companyName')?.value;
        const cCurr = settingsData.data.find((s: any) => s.key === 'currency')?.value;
        if (cName) setCompanyName(JSON.parse(cName));
        if (cCurr) setCurrency(JSON.parse(cCurr));
      }
    }).finally(() => setLoading(false));
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

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, currency })
      });
      if (res.ok) {
        toast.success('Configuration saved');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (e) {
      toast.error('Failed to save configuration');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="General Settings" description="Global platform configurations." />
      
      <Card>
        <form onSubmit={saveSettings}>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Basic information used across the platform and invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  value={companyName} 
                  onChange={e => setCompanyName(e.target.value)} 
                  placeholder="Company Name" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input 
                  id="currency" 
                  value={currency} 
                  onChange={e => setCurrency(e.target.value)} 
                  placeholder="USD" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={savingSettings || loading}>
                {savingSettings ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
          </CardContent>
        </form>
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
