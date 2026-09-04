'use client';

import * as React from 'react';
import { Briefcase, CheckCircle2, Clock, FolderKanban, Plus } from 'lucide-react';
import {
  ProjectsTable,
  type Project,
} from '@/components/projects/projects-table';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ProjectForm } from '@/components/projects/project-form';
import { ProjectPageShell, ProjectStatCard } from '@/components/projects/project-shell';

type Account = { id: string; name: string };

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function fetchAll() {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch('/api/projects?scope=all'),
        fetch('/api/accounts'),
      ]);
      const pJson = await pRes.json();
      const aJson = await aRes.json();
      setProjects(Array.isArray(pJson.data) ? (pJson.data as Project[]) : []);
      setAccounts(Array.isArray(aJson.data) ? (aJson.data as Account[]) : []);
    } catch {
      // Errors are surfaced inside the table itself.
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, []);

  const stats = React.useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const planning = projects.filter(p => p.status === 'planning').length;
    const onHold = projects.filter(p => p.status === 'on_hold').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const totalBudget = projects.reduce(
      (s, p) => s + (parseFloat(String(p.budget || '0')) || 0),
      0
    );
    return { total, active, planning, onHold, completed, totalBudget };
  }, [projects]);

  return (
    <ProjectPageShell
      pretitle="Projects"
      title="Projects Overview"
      description="Manage delivery projects, monitor status, track budgets, and stay on top of every engagement."
      actions={
        <Sheet>
          <SheetTrigger asChild>
            <Button className="gap-1.5 bg-[#059669] hover:bg-[#047857] text-white shadow-sm">
              <Plus className="w-4 h-4" />
              Add Project
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[540px] flex flex-col p-0">
            <SheetHeader className="px-6 py-6 border-b shrink-0">
              <SheetTitle>Create Project</SheetTitle>
              <SheetDescription>
                Add a new project. Default board columns and your assignment are added automatically.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-2 relative h-full">
              <ProjectForm onSuccess={fetchAll} />
            </div>
          </SheetContent>
        </Sheet>
      }
      stats={
        <>
          <ProjectStatCard
            label="Total Projects"
            value={stats.total}
            icon={<FolderKanban />}
            hint="Across the workspace"
          />
          <ProjectStatCard
            label="Active"
            value={stats.active}
            icon={<Briefcase />}
            accent="positive"
            hint="In delivery"
          />
          <ProjectStatCard
            label="Planning"
            value={stats.planning}
            icon={<Clock />}
            accent="warning"
            hint="Not started yet"
          />
          <ProjectStatCard
            label="On Hold"
            value={stats.onHold}
            icon={<CheckCircle2 />}
            accent={stats.onHold > 0 ? 'negative' : 'neutral'}
            hint={stats.onHold > 0 ? 'Needs attention' : 'All clear'}
          />
        </>
      }
    >
      <ProjectsTable projects={projects} accounts={accounts} />
      {loading && projects.length === 0 ? (
        <div className="sr-only">Loading projects…</div>
      ) : null}
    </ProjectPageShell>
  );
}
