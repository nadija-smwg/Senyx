'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.data);

export function useClock() {
  const { data: activeSession, mutate: mutateActiveSession, isValidating: loading } = useSWR('/api/clock/active', fetcher);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchActiveSession = async () => {
    await mutateActiveSession();
  };

  useEffect(() => {
    if (activeSession) {
      const start = new Date(activeSession.clockInAt).getTime();
      const now = Date.now();
      Promise.resolve().then(() => setElapsedSeconds(Math.floor((now - start) / 1000)));
    } else {
      Promise.resolve().then(() => setElapsedSeconds(0));
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
    if (isProcessing) return;
    setIsProcessing(true);
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const clockOut = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    activeSession,
    elapsedSeconds,
    loading,
    isProcessing,
    clockIn,
    clockOut,
  };
}
