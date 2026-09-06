import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { ProjectHeaderActions } from '@/components/projects/project-header-actions';
import { db } from '@/server/db/client';
import { projects, projectAssignments } from '@/server/db/schema/projects';
import { users, userRoles, roles } from '@/server/db/schema/identity';
import { eq, and, isNull } from 'drizzle-orm';
import { createServerClient } from '@supabase/ssr';
import {
  ProjectTabs,
  ProjectStatusBadge,
  type ProjectTab,
} from '@/components/projects/project-shell';

export const metadata: Metadata = {
  title: 'Project Detail',
};

async function getAuthContext(): Promise<{ isAdmin: boolean; employeeId?: string | null }> {
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

async function getProject(id: string) {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    return project;
  } catch {
    return null;
  }
}

async function hasAssignment(projectId: string, employeeId: string): Promise<boolean> {
  const [assignment] = await db
    .select({ id: projectAssignments.id })
    .from(projectAssignments)
    .where(
      and(
        eq(projectAssignments.projectId, projectId),
        eq(projectAssignments.employeeId, employeeId),
        isNull(projectAssignments.unassignedAt)
      )
    );
  return !!assignment;
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const [project, { isAdmin, employeeId }] = await Promise.all([
    getProject(resolvedParams.id),
    getAuthContext(),
  ]);

  if (!project) {
    notFound();
  }

  // Employees: verify they are assigned to this project; show 404 to prevent discovery
  if (!isAdmin) {
    if (!employeeId) {
      notFound();
    }
    const assigned = await hasAssignment(project.id, employeeId);
    if (!assigned) {
      notFound();
    }
  }

  // Detect the active sub-route from the request URL so the tab nav can
  // highlight it. Falls back to the Overview tab.
  const headerList = await headers();
  const rawPath =
    headerList.get('x-invoke-path') ||
    headerList.get('next-url') ||
    headerList.get('x-pathname') ||
    `/projects/${project.id}`;
  const normalizedPath: string = rawPath.split('?')[0] ?? `/projects/${project.id}`;

  // Admin tabs include Payments, Team management; employees get a filtered set
  const adminTabs: ProjectTab[] = [
    { name: 'Overview', href: `/projects/${project.id}`, iconName: 'overview' },
    { name: 'Links', href: `/projects/${project.id}/links`, iconName: 'links' },
    { name: 'Team', href: `/projects/${project.id}/team`, iconName: 'team' },
    { name: 'Milestones', href: `/projects/${project.id}/milestones`, iconName: 'milestones' },
    { name: 'Payments', href: `/projects/${project.id}/payments`, iconName: 'payments' },
    { name: 'Time', href: `/projects/${project.id}/time`, iconName: 'time' },
    { name: 'Risks', href: `/projects/${project.id}/risks`, iconName: 'risks' },
    { name: 'Documents', href: `/projects/${project.id}/documents`, iconName: 'documents' },
  ];

  const employeeTabs: ProjectTab[] = [
    { name: 'Overview', href: `/projects/${project.id}`, iconName: 'overview' },
    { name: 'Links', href: `/projects/${project.id}/links`, iconName: 'links' },
    { name: 'Milestones', href: `/projects/${project.id}/milestones`, iconName: 'milestones' },
    { name: 'Time', href: `/projects/${project.id}/time`, iconName: 'time' },
    { name: 'Risks', href: `/projects/${project.id}/risks`, iconName: 'risks' },
    { name: 'Documents', href: `/projects/${project.id}/documents`, iconName: 'documents' },
  ];

  const navItems = isAdmin ? adminTabs : employeeTabs;

  return (
    <div className="space-y-4">
      {/* Compact title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#047857]">
            Project
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-extrabold font-heading text-gray-900 tracking-tight truncate">
              {project.name}
            </h2>
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              {project.code}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>
        <ProjectHeaderActions projectId={project.id} isAdmin={isAdmin} />
      </div>

      {/* Polished tab nav */}
      <ProjectTabs tabs={navItems} currentPath={normalizedPath} />

      <div>{children}</div>
    </div>
  );
}
