'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProjectHeaderActionsProps {
  projectId: string;
}

export function ProjectHeaderActions({ projectId }: ProjectHeaderActionsProps) {
  const [clockingIn, setClockingIn] = React.useState(false);

  const handleEdit = () => {
    toast('Edit project functionality is coming in a future update.');
  };

  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      // In a real app, you would make an API call here.
      // e.g. await fetch(`/api/projects/${projectId}/time/clock-in`, { method: 'POST' });
      
      // Simulating a network request
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Successfully clocked in!');
    } catch (err: any) {
      toast.error('Failed to clock in: ' + err.message);
    } finally {
      setClockingIn(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" onClick={handleEdit}>Edit Project</Button>
      <Button onClick={handleClockIn} disabled={clockingIn}>
        {clockingIn ? 'Clocking In...' : 'Clock In'}
      </Button>
    </div>
  );
}
