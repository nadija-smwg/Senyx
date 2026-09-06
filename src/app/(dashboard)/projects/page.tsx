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
import { projects, projectAssignments } from '@/server/db/schema/projects';
import { accounts as accountsSchema } from '@/server/db/schema/crm';
import { isNull, desc, eq, and, inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { users, userRoles, roles } from '@/server/db/schema/identity';

export const dynamic = 'force-dynamic';

async function getCurrentUserRole(): Promise<{ isAdmin: boolean; employeeId?: string | null }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false };

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (!dbUser) return { isAdmin: false };

    const userRolesData = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, dbUser.id));

    const roleNames = userRolesData.map(r => r.roleName);
    const isAdmin = roleNames.includes('Admin') || roleNames.includes('HR Manager');

    return { isAdmin, employeeId: dbUser.employeeId };
  } catch {
    return { isAdmin: false };
  }
}

export default async function ProjectsPage() {
  const { isAdmin, employeeId } = await getCurrentUserRole();

  const accountsData = await db
    .select({ id: accountsSchema.id, name: accountsSchema.name })
    .from(accountsSchema)
    .where(isNull(accountsSchema.deletedAt));

  let projectsData: any[] = [];

  if (isAdmin) {
    // Admins see all projects
    projectsData = await db
      .select()
      .from(projects)
      .where(isNull(projects.deletedAt))
      .orderBy(desc(projects.createdAt));
  } else if (employeeId) {
    // Employees see only their assigned projects
    const assignedProjectIds = await db
      .select({ projectId: projectAssignments.projectId })
      .from(projectAssignments)
      .where(
        and(
          eq(projectAssignments.employeeId, employeeId),
          isNull(projectAssignments.unassignedAt)
        )
      );

    if (assignedProjectIds.length > 0) {
      const ids = assignedProjectIds.map(a => a.projectId);
      projectsData = await db
        .select()
        .from(projects)
        .where(and(isNull(projects.deletedAt), inArray(projects.id, ids)))
        .orderBy(desc(projects.createdAt));
    }
  }

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
      pretitle={isAdmin ? 'Projects' : 'My Projects'}
      title={isAdmin ? 'Projects Overview' : 'My Projects'}
      description={
        isAdmin
          ? 'Manage delivery projects, monitor status, track budgets, and stay on top of every engagement.'
          : 'Projects assigned to you. Track your work, log time, and stay on top of milestones.'
      }
      actions={
        isAdmin ? (
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
        ) : null
      }
      stats={
        <>
          <ProjectStatCard
            label={isAdmin ? 'Total Projects' : 'My Projects'}
            value={stats.total}
            icon={<FolderKanban />}
            hint={isAdmin ? 'Across the workspace' : 'Assigned to you'}
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
      <ProjectsTable
        projects={projectsData as unknown as Project[]}
        accounts={accountsData}
        isAdmin={isAdmin}
      />
    </ProjectPageShell>
  );
}
