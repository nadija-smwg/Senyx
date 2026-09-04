'use client';

import { useEffect, useState } from 'react';
import { Building2, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  SettingsPageShell,
  SettingsNav,
  SettingsGridLayout,
  SettingsSectionCard,
  SettingsField,
  SettingsInput,
  SettingsSaveBar,
} from '@/components/settings/settings-shell';
import { Switch } from '@/components/ui/switch';

type Schedule = {
  id: string;
  name: string;
  target: string;
  isActive: boolean;
  advanceDays: string;
  digestTime: string;
};

export default function GeneralSettingsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('');
  const [savedCompany, setSavedCompany] = useState('');
  const [savedCurrency, setSavedCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ companyName?: string; currency?: string }>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/reminder-schedules').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]).then(([schedData, settingsData]) => {
      if (schedData.data) setSchedules(schedData.data);
      if (settingsData.data) {
        const cName = settingsData.data.find((s: any) => s.key === 'companyName')?.value;
        const cCurr = settingsData.data.find((s: any) => s.key === 'currency')?.value;
        if (cName) {
          const parsed = JSON.parse(cName);
          setCompanyName(parsed);
          setSavedCompany(parsed);
        }
        if (cCurr) {
          const parsed = JSON.parse(cCurr);
          setCurrency(parsed);
          setSavedCurrency(parsed);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const isDirty = companyName !== savedCompany || currency !== savedCurrency;

  const updateSchedule = async (id: string, payload: Partial<Schedule>) => {
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
    } catch {
      toast.error('Failed to update schedule');
    }
  };

  const validate = () => {
    const errs: { companyName?: string; currency?: string } = {};
    if (!companyName.trim()) errs.companyName = 'Company name is required.';
    if (!currency.trim()) errs.currency = 'Currency is required.';
    else if (currency.trim().length < 3 || currency.trim().length > 3) {
      errs.currency = 'Use a 3-letter ISO code (e.g. USD).';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, currency })
      });
      if (res.ok) {
        toast.success('Configuration saved');
        setSavedCompany(companyName);
        setSavedCurrency(currency);
      } else {
        toast.error('Failed to save configuration');
      }
    } catch {
      toast.error('Failed to save configuration');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <SettingsPageShell
      pretitle="Workspace"
      title="General Settings"
      description="Global platform configurations: company information, defaults and background reminders."
    >
      <SettingsGridLayout nav={<SettingsNav />}>
        <SettingsSectionCard
          title="Company Details"
          description="Basic information used across the platform and invoices."
          icon={<Building2 />}
          footer={
            <SettingsSaveBar
              isSaving={savingSettings}
              isDirty={isDirty}
              onSave={() => saveSettings()}
            />
          }
        >
          <form
            onSubmit={saveSettings}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <SettingsField
              htmlFor="companyName"
              label="Company Name"
              required
              error={fieldErrors.companyName}
              hint="Shown on invoices and outbound emails."
            >
              <SettingsInput
                id="companyName"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Acme Holdings"
                invalid={!!fieldErrors.companyName}
              />
            </SettingsField>
            <SettingsField
              htmlFor="currency"
              label="Default Currency"
              required
              error={fieldErrors.currency}
              hint="3-letter ISO code (e.g. USD, EUR, LKR)."
            >
              <SettingsInput
                id="currency"
                value={currency}
                onChange={e => setCurrency(e.target.value.toUpperCase())}
                placeholder="USD"
                maxLength={3}
                invalid={!!fieldErrors.currency}
              />
            </SettingsField>
          </form>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Reminders & Notifications"
          description="Configure background jobs and automated notifications."
          icon={<Bell />}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading schedules…
            </div>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-gray-500">No schedules configured yet.</p>
          ) : (
            <div className="space-y-3">
              {schedules.map(schedule => (
                <div
                  key={schedule.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{schedule.name}</p>
                      <p className="text-[11px] text-gray-500 capitalize">
                        Target: {schedule.target.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Switch
                      checked={schedule.isActive}
                      onCheckedChange={val => updateSchedule(schedule.id, { isActive: val })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                    <SettingsField label="Advance Warning Days" hint="Comma-separated (e.g. 1,3,7).">
                      <SettingsInput
                        defaultValue={schedule.advanceDays}
                        onBlur={e => updateSchedule(schedule.id, { advanceDays: e.target.value })}
                      />
                    </SettingsField>
                    <SettingsField label="Digest Send Time (UTC)" hint="Daily digest delivery time.">
                      <SettingsInput
                        type="time"
                        defaultValue={schedule.digestTime || '08:00'}
                        onBlur={e => updateSchedule(schedule.id, { digestTime: e.target.value })}
                      />
                    </SettingsField>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SettingsSectionCard>
      </SettingsGridLayout>
    </SettingsPageShell>
  );
}
