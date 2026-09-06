'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useClock } from '@/hooks/use-clock';

interface ProjectHeaderActionsProps {
  projectId: string;
  isAdmin?: boolean;
}

export function ProjectHeaderActions({ projectId, isAdmin = false }: ProjectHeaderActionsProps) {
  const { clockIn, activeSession, loading, isProcessing } = useClock();

  const handleEdit = () => {
    toast('Edit project functionality is coming in a future update.');
  };

  const handleClockIn = async () => {
    await clockIn(projectId);
  };

  return (
    <div className="flex space-x-2">
      {isAdmin && <Button variant="outline" onClick={handleEdit}>Edit Project</Button>}
      <Button onClick={handleClockIn} disabled={loading || isProcessing}>
        {loading || isProcessing ? 'Processing...' : (activeSession?.projectId === projectId ? 'Clocked In' : 'Clock In')}
      </Button>
    </div>
  );
}
