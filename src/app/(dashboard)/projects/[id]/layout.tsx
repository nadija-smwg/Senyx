import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { ProjectHeaderActions } from '@/components/projects/project-header-actions';
import { db } from '@/server/db/client';
import { projects } from '@/server/db/schema/projects';
import { eq } from 'drizzle-orm';
import {
  ProjectTabs,
  ProjectStatusBadge,
  type ProjectTab,
} from '@/components/projects/project-shell';

export const metadata: Metadata = {
  title: 'Project Detail',
};

async function getProject(id: string) {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  } catch {
    return null;
  }
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const project = await getProject(resolvedParams.id);

  if (!project) {
    notFound();
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

  const navItems: ProjectTab[] = [
    { name: 'Overview', href: `/projects/${project.id}`, iconName: 'overview' },
    { name: 'Links', href: `/projects/${project.id}/links`, iconName: 'links' },
    { name: 'Team', href: `/projects/${project.id}/team`, iconName: 'team' },
    { name: 'Milestones', href: `/projects/${project.id}/milestones`, iconName: 'milestones' },
    { name: 'Payments', href: `/projects/${project.id}/payments`, iconName: 'payments' },
    { name: 'Time', href: `/projects/${project.id}/time`, iconName: 'time' },
    { name: 'Risks', href: `/projects/${project.id}/risks`, iconName: 'risks' },
    { name: 'Documents', href: `/projects/${project.id}/documents`, iconName: 'documents' },
  ];

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
        <ProjectHeaderActions projectId={project.id} />
      </div>

      {/* Polished tab nav */}
      <ProjectTabs tabs={navItems} currentPath={normalizedPath} />

      <div>{children}</div>
    </div>
  );
}
