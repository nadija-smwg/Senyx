'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useClock } from '@/hooks/use-clock';

interface ProjectHeaderActionsProps {
  projectId: string;
}

export function ProjectHeaderActions({ projectId }: ProjectHeaderActionsProps) {
  const { clockIn, activeSession, loading } = useClock();

  const handleEdit = () => {
    toast('Edit project functionality is coming in a future update.');
  };

  const handleClockIn = async () => {
    await clockIn(projectId);
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" onClick={handleEdit}>Edit Project</Button>
      <Button onClick={handleClockIn} disabled={loading}>
        {loading ? 'Processing...' : (activeSession?.projectId === projectId ? 'Clocked In' : 'Clock In')}
      </Button>
    </div>
  );
}
