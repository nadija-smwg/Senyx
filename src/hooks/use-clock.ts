'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.data);

export function useClock() {
  const { data: activeSession, mutate: mutateActiveSession, isValidating: loading } = useSWR('/api/clock/active', fetcher);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchActiveSession = async () => {
    await mutateActiveSession();
  };

  useEffect(() => {
    if (activeSession) {
      const start = new Date(activeSession.clockInAt).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    } else {
      setElapsedSeconds(0);
    }
  }, [activeSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const clockIn = async (projectId: string, taskId?: string) => {
    try {
      const res = await fetch('/api/clock/in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to clock in');
      toast.success('Clocked in successfully');
      await fetchActiveSession();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const clockOut = async () => {
    try {
      const res = await fetch('/api/clock/out', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to clock out');
      
      // FIX: clockOut returns { clock, entry } — use durationSeconds from clock
      const durationSec = data.data?.clock?.durationSeconds || 0;
      const hours = (durationSec / 3600).toFixed(2);
      toast.success(`Clocked out — ${hours}h logged`);
      
      await mutateActiveSession();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return {
    activeSession,
    elapsedSeconds,
    loading,
    clockIn,
    clockOut,
  };
}
