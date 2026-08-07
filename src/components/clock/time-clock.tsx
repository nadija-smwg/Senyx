'use client';

import * as React from 'react';
import { useClock } from '@/hooks/use-clock';
import { Button } from '@/components/ui/button';
import { Clock, Play, Square } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TimeClock() {
  const { activeSession, elapsedSeconds, loading, clockIn, clockOut } = useClock();
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState('');

  React.useEffect(() => {
    if (open && projects.length === 0) {
      fetch('/api/projects')
        .then(res => res.json())
        .then(json => setProjects(json.data || []));
    }
  }, [open]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <Button variant="ghost" size="sm" disabled><Clock className="h-4 w-4 animate-spin" /></Button>;
  }

  if (activeSession) {
    // Find project name from cached list or use projectId fallback
    const projectName = projects.find(p => p.id === activeSession.projectId)?.name;

    return (
      <div className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
        <Clock className="h-4 w-4 animate-pulse shrink-0" />
        {projectName && (
          <span className="hidden lg:inline text-xs max-w-[120px] truncate">{projectName}</span>
        )}
        <span className="w-[60px] text-center font-mono">{formatTime(elapsedSeconds)}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground rounded-full"
          onClick={() => clockOut()}
        >
          <Square className="h-3 w-3 fill-current" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hidden md:flex gap-2">
          <Play className="h-4 w-4" />
          Clock In
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clock In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            disabled={!selectedProjectId}
            onClick={() => {
              clockIn(selectedProjectId);
              setOpen(false);
            }}
          >
            Start Timer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
