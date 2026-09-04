import * as React from 'react';
import { Briefcase, CheckCircle2, Clock, FolderKanban, Plus } from 'lucide-react';
import { ProjectsTable, type Project } from '@/components/projects/projects-table';
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
import { db } from '@/server/db/client';
import { projects } from '@/server/db/schema/projects';
import { accounts as accountsSchema } from '@/server/db/schema/crm';
import { isNull, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const [projectsData, accountsData] = await Promise.all([
    db.select().from(projects).where(isNull(projects.deletedAt)).orderBy(desc(projects.createdAt)),
    db.select({ id: accountsSchema.id, name: accountsSchema.name }).from(accountsSchema).where(isNull(accountsSchema.deletedAt)),
  ]);

  const stats = {
    total: projectsData.length,
    active: projectsData.filter(p => p.status === 'active').length,
    planning: projectsData.filter(p => p.status === 'planning').length,
    onHold: projectsData.filter(p => p.status === 'on_hold').length,
    completed: projectsData.filter(p => p.status === 'completed').length,
    totalBudget: projectsData.reduce((s, p) => s + (parseFloat(String(p.budget || '0')) || 0), 0),
  };

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
              <ProjectForm />
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
      <ProjectsTable projects={projectsData as unknown as Project[]} accounts={accountsData} />
    </ProjectPageShell>
  );
}
